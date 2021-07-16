```sh
docker run -dit \
    --memory 300M \
    -v $PWD/panel/config:/root/jd/config \
    -v $PWD/panel/log:/root/jd/log \
    -v $PWD/scripts:/root/jd/scripts \
    -p 5679:5678 \
    --name panel \
    --restart always \
    virola/js_panel
```
