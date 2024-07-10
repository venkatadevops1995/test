############################################################
# Dockerfile to build Django application as backend and nodejs as frontend  
# Based on Ubuntu
############################################################

# Set the base image to Ubuntu
FROM ubuntu:18.04

# File Author / Maintainer
MAINTAINER MuralidharPalla 

# Update the repository sources list
RUN apt-get update

################## BEGIN INSTALLATION ######################

# Add the package ssh and vim
RUN apt-get install ssh vim net-tools openssh-server htop -y

# Add the package curl
RUN apt-get install curl git -y


# get install script and pass it to execute: 
RUN curl -sL https://deb.nodesource.com/setup_10.x | bash -

# Install Nodejs package (.deb)
RUN apt-get install -y nodejs

RUN apt-get -y install python3
# Create the default data directory
#RUN mkdir -p /data/db

### New setup
RUN apt-get update
RUN apt-get -y install python3-pip

RUN apt-get -y install build-essential libssl-dev python3.6-dev libmysqlclient-dev cron apt-utils 
RUN pip3 install mysqlclient
RUN apt-get -y install git



#Set IST as default timezone
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get -y install tzdata

ENV TZ="Asia/Kolkata"
RUN echo $TZ > /etc/timezone && \
    rm /etc/localtime && \
    ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && \
    dpkg-reconfigure -f noninteractive tzdata && \
    apt-get clean

#adding settings in crontab
# Setup cron job
RUN (crontab -l ; echo "DJANGO_SETTINGS_MODULE=vedikaweb.test_settings") | crontab

RUN npm i -g @angular/cli

RUN mkdir -p Vedika

COPY Vedika  /Vedika

RUN pip3 install gunicorn

## got error in config used below steps
RUN pip3 uninstall setuptools
RUN pip3 install setuptools


RUN pip3 install -r /Vedika/backend/requirements.txt 

#----------------------------------

RUN cd /Vedika/front-end
RUN rm -rf /Vedika/front-end/dist
WORKDIR /Vedika/front-end
RUN npm install
RUN ng build --configuration=test
#RUN ng build
RUN cp -r /Vedika/front-end/dist/front-end/* /Vedika/app/templates/

RUN cd /Vedika/app/
WORKDIR /Vedika/app/
RUN npm install

#----------------------------------


##PULL The files from git (1) 
COPY ./vedika_docker-entrypoint.sh  /


RUN chmod a+x /vedika_docker-entrypoint.sh

##################### INSTALLATION END #####################

# Expose the default port
 EXPOSE 8000
 EXPOSE 8001
 EXPOSE 3306

#CMD ["/bin/bash"]
ENTRYPOINT ["/vedika_docker-entrypoint.sh"]



