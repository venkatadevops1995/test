if [ $# -gt 0 ];then
    a=`echo $1 | sed -n s'/^\([[:digit:]]\{4\}-[[:digit:]]\{2\}-[[:digit:]]\{2\}\)/\1/p'`
    echo "a = $a"
    if [ ! -z "$a" ];then
        sshpass -p 'Welcome123' ssh mpalla@10.60.62.83  "bash /home/mpalla/test/change_time.sh $a";
        echo "time changed to $a"
    else echo "please provide valid date YYYY-MM-DD"
    fi
fi

# use for changing the date remotely for atwork test automation

# mpalla ALL=(ALL) NOPASSWD:/home/mpalla/test/change_time.sh

#  cat crons | sed 's@^5[[:space:]]0.*\(/usr/bin/python3[[:space:]].+\)#.*@\1@'
