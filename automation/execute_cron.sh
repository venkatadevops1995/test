if [ $# -gt 0 ];then
    sshpass -p 'Welcome123' ssh mpalla@10.60.62.83  "bash /home/mpalla/test/run_cron.sh $1";
    echo "cron $1 executed"
else echo "please enter cronid"
fi