param location string = 'centralus'

@secure()
param adminPassword string

param adminUsername string = 'azureuser'

resource vnet 'Microsoft.Network/virtualNetworks@2023-05-01' = {
  name: 'vnet-myecomm'
  location: location

  properties: {
    addressSpace: {
      addressPrefixes: [
        '10.0.0.0/16'
      ]
    }

    subnets: [
      {
        name: 'subnet-web'

        properties: {
          addressPrefix: '10.0.1.0/24'
        }
      }
    ]
  }
}

resource nsg 'Microsoft.Network/networkSecurityGroups@2023-05-01' = {
  name: 'nsg-web'
  location: location
}

resource sshRule 'Microsoft.Network/networkSecurityGroups/securityRules@2023-05-01' = {
  parent: nsg
  name: 'AllowSSH'

  properties: {
    priority: 100
    access: 'Allow'
    direction: 'Inbound'
    protocol: 'Tcp'
    sourcePortRange: '*'
    destinationPortRange: '22'
    sourceAddressPrefix: '*'
    destinationAddressPrefix: '*'
  }
}

resource httpRule 'Microsoft.Network/networkSecurityGroups/securityRules@2023-05-01' = {
  parent: nsg
  name: 'AllowHTTP'

  properties: {
    priority: 110
    access: 'Allow'
    direction: 'Inbound'
    protocol: 'Tcp'
    sourcePortRange: '*'
    destinationPortRange: '80'
    sourceAddressPrefix: '*'
    destinationAddressPrefix: '*'
  }
}

resource subnetNsg 'Microsoft.Network/virtualNetworks/subnets@2023-05-01' = {
  parent: vnet
  name: 'subnet-web'

  properties: {
    addressPrefix: '10.0.1.0/24'

    networkSecurityGroup: {
      id: nsg.id
    }
  }
}

resource publicIP 'Microsoft.Network/publicIPAddresses@2023-05-01' = {
  name: 'lb-public-ip'
  location: location

  sku: {
    name: 'Standard'
  }

  properties: {
    publicIPAllocationMethod: 'Static'
  }
}

resource lb 'Microsoft.Network/loadBalancers@2023-05-01' = {
  name: 'lb-myecomm'
  location: location

  sku: {
    name: 'Standard'
  }

  properties: {

    frontendIPConfigurations: [
      {
        name: 'frontendPool'

        properties: {
          publicIPAddress: {
            id: publicIP.id
          }
        }
      }
    ]

    backendAddressPools: [
      {
        name: 'backendPool'
      }
    ]

    probes: [
      {
        name: 'httpProbe'

        properties: {
          protocol: 'Tcp'
          port: 80
        }
      }
    ]

    loadBalancingRules: [
      {
        name: 'httpRule'

        properties: {

          frontendIPConfiguration: {
            id: '${lb.id}/frontendIPConfigurations/frontendPool'
          }

          backendAddressPool: {
            id: '${lb.id}/backendAddressPools/backendPool'
          }

          probe: {
            id: '${lb.id}/probes/httpProbe'
          }

          protocol: 'Tcp'
          frontendPort: 80
          backendPort: 80
          enableFloatingIP: false
          idleTimeoutInMinutes: 4
          loadDistribution: 'Default'
          disableOutboundSnat: true
        }
      }
    ]
  }
}

resource vmss 'Microsoft.Compute/virtualMachineScaleSets@2023-03-01' = {
  name: 'myecomm-vmss'
  location: location

  sku: {
    name: 'Standard_D2s_v3'
    tier: 'Standard'
    capacity: 2
  }

  properties: {

    upgradePolicy: {
      mode: 'Automatic'
    }

    virtualMachineProfile: {

      osProfile: {
        computerNamePrefix: 'myecomm'
        adminUsername: adminUsername
        adminPassword: adminPassword

        customData: loadFileAsBase64('cloud-init.txt')

        linuxConfiguration: {
          disablePasswordAuthentication: false
        }
      }

      storageProfile: {
        imageReference: {
          publisher: 'Canonical'
          offer: '0001-com-ubuntu-server-jammy'
          sku: '22_04-lts-gen2'
          version: 'latest'
        }
      }

      networkProfile: {
        networkInterfaceConfigurations: [
          {
            name: 'nicconfig'

            properties: {
              primary: true

              ipConfigurations: [
                {
                  name: 'ipconfig'

                  properties: {

                    subnet: {
                      id: subnetNsg.id
                    }

                    loadBalancerBackendAddressPools: [
                      {
                        id: '${lb.id}/backendAddressPools/backendPool'
                      }
                    ]
                  }
                }
              ]
            }
          }
        ]
      }
    }
  }
}
