
#! /bin/sh
rm -rf ./Vedika
git clone http://pmoulalibasha:Welcome%40123@phabricator.soct.com/source/Vedika.git
sudo docker build -t vedika_web_docker_test .
