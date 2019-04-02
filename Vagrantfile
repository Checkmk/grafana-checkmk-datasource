Vagrant.configure("2") do |config|
  config.vm.box = "hashicorp/precise64"
  config.vm.network "private_network", ip: "192.168.1.11"
  config.vm.provision :shell, path: "vagrant-init.sh"
end
