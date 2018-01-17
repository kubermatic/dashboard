import { SSHKeyEntity } from '../../shared/entity/SSHKeyEntity';

export const SSHKeysFake: SSHKeyEntity[] = [
    {
        metadata: {
            name: 'key-347746ef07d8e090f84a6751fec7166c-ol3l',
            selfLink: '/apis/kubermatic.k8s.io/v1/key-347746ef07d8e090f84a6751fec7166c-ol3l',
            uid: '06cc8d3c-cecb-11e7-b2b4-42010a9c0050',
            creationTimestamp: new Date(),
            labels: new Map(),
            annotations: new Map(),
        },
        spec: {
            name: 'ssh-rsa',
            fingerprint: '34:77:46:ef:07:d8:e0:90:f8:4a:67:51:fe:c7:16:6c',
            publicKey: 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQC8GbouhtjZz0w/LryeY8AdJ3Glr29nZsJ+dOeY6gf2x0xmvY2HNywsHdKZntAPhvfSecxilu48XlyqBazgCKJLaWsPFFO5/nkJgkhJgz9S8eYku7Z2dm9rdsDherukIH4RQ7fK1D+wH+boTeZxQh2HB4BrTbUGAWoIQo9A7Q4i/nd84ftkgBSGQIZfaOM0sFC/6koBW77jSFgkqmtRK86xngsh2wiXuNYZNLMM8DqfHso50Drqw2U/9A9yss5Um0HBNXMrTGgRVwt79NUvapOFbe/prbpzpBDXgkCxyQtPWyi1v0Y+LqdOoeNPu6OHhTthuwNlYVIYNQ40nbNDO1KsF89MnKY9P8Lor2gcTaR2EKpOq3hE1upAdhaagwDobSQRh+umN2k+v/mqH8N5PEZ/ocLLKv7kXPT7J6ibr545oTuaTo+i8y2g5kx7iwvFzzBKLY2KXg0YnGSJYC8tKznU4sJhTr1Um0BUbs1tiDgxh6rA2/1tM7SniseoMmphnKwSdq6if1LY4XMnBoA3Hc2g2aJeXhj9nd/usD29ajAe+TPloAH+fu2ZUgNECmgznfeDdDAF9uZnTocnBpchyGl2D8dEV27HcmGHRbuswvj7almuZQcA2DClI2IpOMwsGAZRrzDmPeZZt0+7Cd/aJGngTOrVnsGMvXEl2IjpHgX+XQ== eugene_dombrovski@smartexlab.com',
            clusters: [
                'clustername', 'alalalalal'
            ]
        }
    },
    {
        metadata: {
            name: 'key-62a96571691c1f2d65575cef4fae6d6b-b0lm',
            selfLink: '/apis/kubermatic.k8s.io/v1/key-62a96571691c1f2d65575cef4fae6d6b-b0lm',
            uid: 'd868afc0-f1fb-11e7-a75c-42010a9c0050',
            creationTimestamp: new Date(),
            labels: new Map(),
            annotations: new Map()
        },
        spec: {
            name: 'Eugene@DESKTOP-1LADC2V',
            fingerprint: '62:a9:65:71:69:1c:1f:2d:65:57:5c:ef:4f:ae:6d:6b',
            publicKey: 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDgV2cy2Jk242M2KB1s9/gRbR0je/N9doOCAEFuKB3zzqjyMk1XVbQeZaF7xlLlhqbp4Xkhk5M8mGU14l86BUwEIDros0y4cn8slhRwUrTYnARKilQ5+pHVChVEMWMt/II4jCeNz3v/kciHRxCwfCLAARdx48lSGQSar19/kyZftQFsjM1fW1FYFR7f6kuKrkiQ7EjHdLH3JpZqTP8YnXCP5try4nkajug6QyaLUI2qAE3sOHooQry1sJBgNqb13GOGUlhH7eQqpR0PuE55lh7RDjcMhZHAVyxK7MYVX6/U0afEIjFKCH8vStKCaZA786PzyN0j1g/J7VfGf1ZeDzb7 Eugene@DESKTOP-1LADC2V',
            clusters: [
            ]
        }
    }
];
