#/bin/bash
# Slow Network scanner using ping

for i in {2..254}; do
  if [ "$i" = "64" ]; then echo "at 64" ; fi
  if [ "$i" = "128" ]; then echo "at 128" ; fi
  if [ "$i" = "192" ]; then echo "at 192" ; fi
  ping -c 1 -W 0.5 -i 0.8 -t 1 "192.168.43.$i" > /dev/null
  if [ "$?" = "0" ]; then echo  "192.168.43.$i is alive" ; fi
done

echo "Done";
