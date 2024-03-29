package handler

import (
	"net/http"
	"strconv"

	"github.com/Sensetif/sensetif-app-plugin/pkg/client"
	"github.com/Sensetif/sensetif-app-plugin/pkg/model"
	"github.com/grafana/grafana-plugin-sdk-go/backend"
)

func ImportLink2WebFvc1(orgId int64, req ResourceRequest, clients *client.Clients) (*backend.CallResourceResponse, error) {
	clients.Pulsar.Send(model.ConfigurationTopic, "2:"+strconv.FormatInt(orgId, 10)+":importLink2WebFvc1", req.Body)
	return &backend.CallResourceResponse{
		Status: http.StatusAccepted,
	}, nil
}

func ImportEon(orgId int64, req ResourceRequest, clients *client.Clients) (*backend.CallResourceResponse, error) {
	clients.Pulsar.Send(model.ConfigurationTopic, "2:"+strconv.FormatInt(orgId, 10)+":importEon", req.Body)
	return &backend.CallResourceResponse{
		Status: http.StatusAccepted,
	}, nil
}

func ImportTtnv3App(orgId int64, req ResourceRequest, clients *client.Clients) (*backend.CallResourceResponse, error) {
	clients.Pulsar.Send(model.ConfigurationTopic, "2:"+strconv.FormatInt(orgId, 10)+":importTtnv3App", req.Body)
	return &backend.CallResourceResponse{
		Status: http.StatusAccepted,
	}, nil
}
