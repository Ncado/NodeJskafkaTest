import Kafka from 'node-rdkafka';
import avro from 'avsc';

const eventType = avro.Type.forSchema({
  type: 'record',
  fields: [
    {"name": "humanName",  "type": "string"},
    {"name": "msgText",  "type": "string"},
  
]   
});






let paused = false;

const onData = async (data) => {
  console.log(`received message: ${eventType.fromBuffer(data.value)}`);
  return Promise.resolve();
}
const msgQueue = async.queue(async (data, done) => {
    await handleCB(data, onData);
    done();
  }, 3); ///config.maxParallelHandles

  



  const onRebalance = async (err, assignments) => {
    if (err.code === kafka.CODES.ERRORS.ERR__ASSIGN_PARTITIONS) {
      consumer.assign(assignments);
    } else if (err.code === kafka.CODES.ERRORS.ERR__REVOKE_PARTITIONS) {
      if (paused) {
        consumer.resume(assignments);
        pasued = false;
      }
      msgQueue.remove((d, p) => { return true; });
      consumer.unassign();
    } else {
      console.error(`Rebalace error : ${err}`);
    }
  }



// 'metadata.broker.list': 'host.docker.internal:9092',
var consumer = new kafka.KafkaConsumer({
  'group.id': 'kafka',
  'metadata.broker.list': 'host.docker.internal:9092',
  'rebalance_cb': onRebalance.bind(this),
}, {});


consumer.connect();
consumer.on('ready', () => {
  consumer.subscribe(['test']);
  consumer.consume();
}).on('data', (data) => {
   msgQueue.push(data);
    if (msgQueue.length() > 1) { // this.msgQueue.length() > config.maxQueueSize
      this.kafkaConsumer.pause(consumer.assignments());
      this.paused = true;
    }
});



let drain = async () => {
  if (paused) {
    consumer.resume(consumer.assignments());
    pasued = false;
  }
}

const handleCB = async(data, handler) => {
  await handler(data);
}
