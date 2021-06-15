package main

import (
	"fmt"
	"math/rand"
	"os"
	"strconv"
	"strings"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/datasource"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
)

func main() {
	log.DefaultLogger.Info("Starting Sensetif plugin")
	hosts, cassandraClient := createCassandraClient()
	kafkaClient := createKafkaClient()
	resourceHandler := createProjectHandler(&cassandraClient, kafkaClient)
	ds := createDatasource(&cassandraClient, hosts)
	startServing(ds, resourceHandler)
}

func startServing(ds SensetifDatasource, resourceHandler backend.CallResourceHandler) {
	log.DefaultLogger.Info("startServing()")
	serveOpts := datasource.ServeOpts{
		CallResourceHandler: resourceHandler,
		QueryDataHandler:    &ds,
		CheckHealthHandler:  &ds,
	}

	err := datasource.Serve(serveOpts)
	if err != nil {
		log.DefaultLogger.Error(err.Error())
		os.Exit(1)
	}
}

func createDatasource(cassandraClient *CassandraClient, hosts []string) SensetifDatasource {
	log.DefaultLogger.Info("createDatasource()")
	ds := SensetifDatasource{
		cassandraClient: cassandraClient,
		hosts:           hosts,
	}
	ds.initializeInstance()
	return ds
}

func createProjectHandler(cassandraClient *CassandraClient, kafkaClient *KafkaClient) backend.CallResourceHandler {
	log.DefaultLogger.Info("createProjectHandler()")
	projectHandler := ProjectHandler{
		cassandraClient: cassandraClient,
		kafkaClient:     kafkaClient,
	}
	return projectHandler
}

func createCassandraClient() ([]string, CassandraClient) {
	log.DefaultLogger.Info("createCassandraClient()")
	hosts := cassandraHosts()
	cassandraClient := CassandraClient{}
	cassandraClient.initializeCassandra(hosts)
	return hosts, cassandraClient
}

func cassandraHosts() []string {
	log.DefaultLogger.Info("cassandraHosts()")
	if hosts, ok := os.LookupEnv("CASSANDRA_HOSTS"); ok {
		log.DefaultLogger.Info(fmt.Sprintf("Found Cassandra Hosts:%s", hosts))
		return strings.Split(hosts, ",")
	}
	return []string{"192.168.1.42"} // Default at Niclas' lab
}

func createKafkaClient() *KafkaClient {
	log.DefaultLogger.Info("createCassandraClient()")
	hosts := kafkaHosts()
	kafkaClient := KafkaClient{}
	clientId, err := os.Hostname()
	if err != nil {
		log.DefaultLogger.Error(fmt.Sprintf("Unable to get os.Hostname(): %s", err))
		clientId = "grafana" + strconv.FormatInt(rand.Int63(), 10)
	}
	kafkaClient.initializeKafka(hosts, clientId)
	return &kafkaClient
}

func kafkaHosts() []string {
	log.DefaultLogger.Info("kafkaHosts()")
	if hosts, ok := os.LookupEnv("KAFKA_HOSTS"); ok {
		log.DefaultLogger.Info(fmt.Sprintf("Found Kafka Hosts:%s", hosts))
		return strings.Split(hosts, ",")
	}
	return []string{"192.168.1.42:9092"} // Default at Niclas' lab
}
