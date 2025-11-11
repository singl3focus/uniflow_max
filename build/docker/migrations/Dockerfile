FROM alpine:3.18

ARG MIGRATIONS_DIR
ARG TZ

RUN apk update && \
    apk upgrade && \
    apk add --no-cache bash tzdata && \
    cp /usr/share/zoneinfo/${TZ} /etc/localtime && \
    echo "${TZ}" > /etc/timezone && \
    apk del tzdata

ADD https://github.com/pressly/goose/releases/download/v3.14.0/goose_linux_x86_64 /bin/goose
RUN chmod +x /bin/goose

WORKDIR /opt/migrations

RUN mkdir -p migrations

COPY ${MIGRATIONS_DIR} ./migrations/

RUN echo "migrations_dir=${MIGRATIONS_DIR}"
RUN ls -laR > /ls_output.txt && cat /ls_output.txt

CMD ["sh", "-c", "sleep 2 && goose -dir ./migrations postgres \"${PG_DSN}\" up -v"]