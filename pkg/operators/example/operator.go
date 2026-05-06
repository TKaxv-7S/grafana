package example

import (
	"fmt"
	"os"

	authnlib "github.com/grafana/authlib/authn"
	"github.com/grafana/grafana-app-sdk/logging"
	"github.com/grafana/grafana-app-sdk/operator"
	"github.com/grafana/grafana-app-sdk/simple"
	"github.com/grafana/grafana/apps/example/pkg/apis/manifestdata"
	exampleapp "github.com/grafana/grafana/apps/example/pkg/app"
	"github.com/grafana/grafana/pkg/clientauth"
	"github.com/grafana/grafana/pkg/server"
	"k8s.io/client-go/rest"
)

func NewOperator() server.Operator {
	return server.Operator{
		Name:        "example-operator",
		Description: "Example app operator",
		RunFunc: func(deps server.OperatorDependencies) error {
			// TODO: not sure if this is necessary
			restCfg, err := rest.InClusterConfig()
			if err != nil {
				panic(err)
			}

			kubeCfg := *restCfg

			// TODO: change these to config flags to get from INI
			tokenExchangeURL := os.Getenv("TOKEN_EXCHANGE_URL")
			tokenExchangeToken := os.Getenv("TOKEN_EXCHANGE_TOKEN")
			host := os.Getenv("APISERVER_HOST")

			// Exchanger is needed for the transport wrapper used by the kubeConfig
			exchanger, err := authnlib.NewTokenExchangeClient(authnlib.TokenExchangeConfig{
				Token:            tokenExchangeToken,
				TokenExchangeURL: tokenExchangeURL,
			})
			if err != nil {
				panic(fmt.Errorf("failed to create token exchange client: %w", err))
			}

			// Construct the kubeConfig to use for talking to the APIServer
			kubeCfg = rest.Config{
				Host:    host,
				APIPath: "/apis",
				TLSClientConfig: rest.TLSClientConfig{
					Insecure: true,
				},
				WrapTransport: clientauth.NewStaticTokenExchangeTransportWrapper(exchanger, "audience", "*"),
			}
			logging.DefaultLogger.Info("Using token exchange auth for apiextensions-apiserver",
				"host", host, "tokenExchangeURL", tokenExchangeURL)

			cfg := exampleapp.ExampleConfig{
				EnableReconciler: true,
			}
			runner, err := operator.NewRunner(operator.RunnerConfig{
				KubeConfig: kubeCfg,
			})
			if err != nil {
				return fmt.Errorf("unable to create operator runner")
			}
			return runner.Run(deps.CLIContext.Context, simple.NewAppProvider(manifestdata.LocalManifest(), &cfg, exampleapp.New))
		},
	}
}
