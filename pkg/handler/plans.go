package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strconv"

	"github.com/Sensetif/sensetif-app-plugin/pkg/client"
	"github.com/Sensetif/sensetif-app-plugin/pkg/model"
	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	"github.com/stripe/stripe-go/v72"
	"github.com/stripe/stripe-go/v72/checkout/session"
)

type PlanPricing struct {
	Price string `json:"price"`
}

type SubscriptionInfo struct {
	Amount          int64                               `json:"amount"`
	Currency        stripe.Currency                     `json:"currency"`
	Subscription    string                              `json:"subscription"`
	CheckoutSession string                              `json:"checkoutSession"`
	Success         bool                                `json:"success"`
	Customer        string                              `json:"customer"`
	Email           string                              `json:"email"`
	PaymentStatus   stripe.CheckoutSessionPaymentStatus `json:"paymentStatus"`
}

type SessionProxy struct {
	Id string `json:"id"`
}

func CurrentLimits(orgId int64, _ ResourceRequest, clients *client.Clients) (*backend.CallResourceResponse, error) {
	limits, _ := clients.Cassandra.GetCurrentLimits(orgId)
	limitsInJson, err := json.Marshal(limits)
	if err != nil {
		return &backend.CallResourceResponse{
			Status:  http.StatusInternalServerError,
			Headers: make(map[string][]string),
			Body:    []byte("JSON marshaling failed for unknown reason."),
		}, nil
	}
	return &backend.CallResourceResponse{
		Status:  http.StatusOK,
		Headers: make(map[string][]string),
		Body:    limitsInJson,
	}, nil
}

func ListPlans(orgId int64, _ ResourceRequest, clients *client.Clients) (*backend.CallResourceResponse, error) {
	log.DefaultLogger.Info("ListPlans()")

	productPrices := map[string][]stripe.Price{}
	for _, prize := range clients.Stripe.Prices {
		if prize.Active {
			productPrices[prize.Product.ID] = append(productPrices[prize.Product.ID], prize)
		}
	}

	organization, err := clients.Cassandra.GetOrganization(orgId)
	if err != nil {
		log.DefaultLogger.Error("Unable to read organization.")
		return nil, fmt.Errorf("%w: %s", model.ErrUnprocessableEntity, err.Error())
	}
	var result []*model.PlanSettings
	for _, prod := range clients.Stripe.Products {
		if prod.Metadata["category"] == "sensetif" && prod.Active {
			result = append(result, &model.PlanSettings{
				Product:     prod,
				Prices:      productPrices[prod.ID],
				Selected:    clients.Stripe.IsSelected(orgId, prod.ID, organization.StripeCustomer),
				Expired:     false,
				GracePeriod: true,
			})
		}
	}

	plansInJson, _ := json.Marshal(result)
	log.DefaultLogger.With("plans", string(plansInJson)).Info("Plans")
	return &backend.CallResourceResponse{
		Status:  http.StatusOK,
		Headers: make(map[string][]string),
		Body:    plansInJson,
	}, nil
}

func CheckOut(orgId int64, req ResourceRequest, _ *client.Clients) (*backend.CallResourceResponse, error) {
	log.DefaultLogger.With("org", orgId).With("params", req.Params).With("body", string(req.Body)).Info("CheckOut")

	var pricing PlanPricing
	err := json.Unmarshal(req.Body, &pricing)
	if err != nil {
		return nil, err
	}
	stripe.Key = GetStripeKey()
	successUrl := "https://sensetif.net/a/sensetif-app?tab=succeeded&session_id={CHECKOUT_SESSION_ID}"
	cancelUrl := "https://sensetif.net/a/sensetif-app?tab=cancelled&session_id={CHECKOUT_SESSION_ID}"
	params := &stripe.CheckoutSessionParams{
		SuccessURL: &successUrl,
		CancelURL:  &cancelUrl,

		PaymentMethodTypes: stripe.StringSlice([]string{
			//"alipay",
			"card",
			//"ideal",
			//"fpx",
			//"bacs_debit",
			//"bancontact",
			//"giropay",
			//"p24",
			//"eps",
			//"sofort",
			"sepa_debit",
			//"grabpay",
			//"afterpay_clearpay",
			//"acss_debit",
			//"wechat_pay",
			//"boleto",
			//"oxxo",
		}),
		Mode: stripe.String(string(stripe.CheckoutSessionModeSubscription)),
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{
				Price:    stripe.String(pricing.Price),
				Quantity: stripe.Int64(1),
			},
		},
	}
	log.DefaultLogger.Info("Calling Stripe")
	sess, err := session.New(params)
	if err != nil {
		log.DefaultLogger.With("error", err).Error("Strip error")
		return &backend.CallResourceResponse{
			Status:  http.StatusBadRequest,
			Headers: make(map[string][]string),
			Body:    []byte("{\"message\": \"Unable to establish Stripe session. Please try again later.\"}"),
		}, nil
	} else {
		log.DefaultLogger.Info("Redirect browser to", "session_url", sess.URL)
		return &backend.CallResourceResponse{
			Status: http.StatusOK,
			Body:   []byte(sess.URL),
		}, nil
	}
}

func CheckOutSuccess(orgId int64, req ResourceRequest, clients *client.Clients) (*backend.CallResourceResponse, error) {
	var sessionProxy SessionProxy
	err := json.Unmarshal(req.Body, &sessionProxy)
	if err != nil {
		return nil, err
	}
	params := &stripe.CheckoutSessionParams{}
	stripeSession, err := session.Get(sessionProxy.Id, params)
	if err != nil {
		log.DefaultLogger.Error("Unable to GET checkout session after Success")
		return &backend.CallResourceResponse{
			Status: http.StatusInternalServerError,
			Body:   []byte(fmt.Sprintf("%+v", err)),
		}, nil
	}
	log.DefaultLogger.
		With("org", orgId).
		With("valid_days", stripeSession.Subscription.DaysUntilDue).
		With("from", stripeSession.Subscription.CurrentPeriodStart).
		With("to", stripeSession.Subscription.CurrentPeriodEnd).
		With("session_id", stripeSession.ID).
		With("subscription", stripeSession.Subscription.ID).
		Info("CheckOutSuccess()")

	paymentInfo := SubscriptionInfo{
		Customer:        stripeSession.Customer.ID,
		Email:           stripeSession.CustomerDetails.Email,
		Amount:          stripeSession.AmountTotal,
		Currency:        stripeSession.Currency,
		Subscription:    stripeSession.Subscription.ID,
		CheckoutSession: stripeSession.ID,
		Success:         true,
		PaymentStatus:   stripeSession.PaymentStatus,
	}
	bytes, err := json.Marshal(paymentInfo)
	if err == nil {
		clients.Pulsar.Send(model.PaymentsTopic, "2:"+strconv.FormatInt(orgId, 10), bytes)
	} else {
		clients.Pulsar.Send(model.PaymentErrorTopic, "2:"+strconv.FormatInt(orgId, 10), []byte(fmt.Sprintf("%+v", err)))
	}

	return &backend.CallResourceResponse{
		Status: http.StatusOK,
		Body:   nil,
	}, nil
}

func CheckOutCancelled(orgId int64, req ResourceRequest, clients *client.Clients) (*backend.CallResourceResponse, error) {
	log.DefaultLogger.Info("CheckOutCancelled(" + strconv.FormatInt(orgId, 10) + ")")
	var sessionProxy SessionProxy
	err := json.Unmarshal(req.Body, &sessionProxy)
	if err != nil {
		return nil, err
	}
	params := &stripe.CheckoutSessionParams{}
	stripeSession, err := session.Get(sessionProxy.Id, params)
	if err != nil {
		log.DefaultLogger.Error("Unable to GET checkout session after Success")
		return &backend.CallResourceResponse{
			Status: http.StatusInternalServerError,
			Body:   []byte(fmt.Sprintf("%+v", err)),
		}, nil
	}
	log.DefaultLogger.Info("CheckOutCancelled() Session=" + stripeSession.ID + ", Subscription=" + stripeSession.Subscription.ID)

	paymentInfo := SubscriptionInfo{
		Customer:        stripeSession.Customer.ID,
		Email:           stripeSession.CustomerDetails.Email,
		Amount:          stripeSession.AmountTotal,
		Currency:        stripeSession.Currency,
		Subscription:    stripeSession.Subscription.ID,
		CheckoutSession: stripeSession.ID,
		Success:         false,
		PaymentStatus:   stripeSession.PaymentStatus,
	}
	bytes, err := json.Marshal(paymentInfo)
	if err == nil {
		clients.Pulsar.Send(model.PaymentsTopic, strconv.FormatInt(orgId, 10), bytes)
	} else {
		clients.Pulsar.Send(model.PaymentErrorTopic, strconv.FormatInt(orgId, 10), []byte(fmt.Sprintf("%+v", err)))
	}
	return &backend.CallResourceResponse{
		Status: http.StatusOK,
		Body:   nil,
	}, nil
}

func GetStripeKey() string {
	if key, ok := os.LookupEnv("STRIPE_KEY"); ok {
		return key
	}
	// If not set in environment, return the key for the Strip Test Mode.
	return "sk_test_51JZvsFBil9jp3I2LySc7piIiEpXUlDdcxpXdVERSLL10nv2AUM1dfoCjSAZIMJ2XlC8zK1tkxJw85F2KlkBh9mxE00Vne8Kp5Z"
}
