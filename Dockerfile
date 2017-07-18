FROM nginx
MAINTAINER Dr. Stefan Schimanski <stefan.schimanski@gmail.com>

ADD dist /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN sed -i 's,access_log.*,access_log /dev/stdout main;,' /etc/nginx/nginx.conf
RUN sed -i 's,error_log.*,error_log /dev/stderr warn;,' /etc/nginx/nginx.conf
