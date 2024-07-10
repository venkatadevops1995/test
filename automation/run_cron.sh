if [ $# -gt 0 ];then
    echo "Welcome123"|sudo -S sudo docker exec vedika_web_test /usr/bin/python3 /Vedika/backend/manage.py crontab run $1
else 
    echo "please enter cronid"
fi
