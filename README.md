# Hyperledger Fabric sample project kubernetes deployment

To run the deployment, make sure you have a kubernetes cluster, minikube also works.

Run following commands in order to start the deployment

```bash
$ ./init.sh samples/simple/ samples/chaincode/
```

This command will prepare the deployments directory. After this, run,
```bash
$ helm install hlf-kube ./hlf-kube -f samples/simple/network.yaml -f samples/simple/crypto-config.yaml --kubeconfig ~/.kube/config 
```
Make sure to put the correct address of kubeconfig in the command

This command will deploy the network in around 2-3 mins. Once done, run,
```bash
$ helm template channel-flow/ -f samples/simple/network.yaml -f samples/simple/crypto-config.yaml --kubeconfig ~/.kube/config | argo submit - --watch
$ helm template chaincode-flow/ --kubeconfig ~/.kube/config -f samples/simple/network.yaml -f samples/simple/crypto-config.yaml | argo submit - --watch
```
This commands will deploy channles and install and instantiate chaincodes on the network.
