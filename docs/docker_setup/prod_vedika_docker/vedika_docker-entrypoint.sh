#!/bin/bash -x

cd /Vedika/backend/

# # starting gunicorn process
# #exec gunicorn artenweb.wsgi:application -w 3 -b 0.0.0.0:8001 --log-level=info --log-file=/gunicorn.log --access-logfile=/access.log & 

# python3 manage.py runserver 0.0.0.0:8005 --settings=vedikaweb.prod_settings &
python3 manage.py runserver 0.0.0.0:8005 &
# #echo "exec gunicorn artenweb.wsgi:application -w 3 -b 0.0.0.0:8000 --log-level=info --log-file=/gunicorn.log --access-logfile=/access.log &"

cd /Vedika/backend/
python3 manage.py crontab remove
python3 manage.py crontab add

cd /Vedika/app/
exec node app.js &

#starting Cron jobs
service cron start

exec "$@";
