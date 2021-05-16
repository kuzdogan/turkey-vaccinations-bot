(export $(grep -v '^#' .env | xargs) && twurl authorize --consumer-key $CONSUMER_KEY --consumer-secret $CONSUMER_SECRET)

