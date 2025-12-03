const AsanakSms = require("soap-asanak-sms");

const sms = new AsanakSms({ debug: true, });

(async () => {
  await sms.send("989121111010", "سلام - این یک پیام تست از npm package");
})();
