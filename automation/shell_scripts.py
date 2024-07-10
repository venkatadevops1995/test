import os


def change_time(time):
    dirname = os.path.dirname(__file__)
    os.system("bash "+os.path.join(dirname,"change_server_time.sh")+" "+time)

def execute_cron(cron):
    dirname = os.path.dirname(__file__)
    os.system("bash "+os.path.join(dirname,"execute_cron.sh")+" "+cron)