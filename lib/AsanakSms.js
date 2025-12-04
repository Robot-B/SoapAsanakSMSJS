const https = require("https");
const { URL } = require("url");

class AsanakSms {
  constructor({ username, password, srcAddress, debug = false } = {}) {
    this.username = username || process.env.ASANAK_USERNAME;
    this.password = password || process.env.ASANAK_PASSWORD;
    this.srcAddress = srcAddress || process.env.ASANAK_SOURCE_NUMBER;
    this.url = process.env.ASANAK_WEBSERVICE || "https://smsapi.asanak.ir/services/CompositeSmsGateway?wsdl";
    this.debug = debug;
  }

  buildXml(destAddress, message) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/"
                   xmlns:ns1="http://webService.compositeSmsGateway.services.sdp.peykasa.com/">
  <SOAP-ENV:Body>
    <ns1:sendSms>
      <userCredential>
        <password>${this.password}</password>
        <username>${this.username}</username>
      </userCredential>
      <srcAddresses>${this.srcAddress}</srcAddresses>
      <destAddresses>${destAddress}</destAddresses>
      <msgBody>${message}</msgBody>
      <msgEncoding>8</msgEncoding>
    </ns1:sendSms>
  </SOAP-ENV:Body>
</SOAP-ENV:Envelope>`;
  }

  send(destAddress, message) {
    const xml = this.buildXml(destAddress, message);
    const urlObj = new URL(this.url);

    if (this.debug) {
      console.log("======== RAW REQUEST BODY ========\n", xml);
    }

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname,
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        "Content-Length": Buffer.byteLength(xml),
        "SOAPAction": ""
      },
      timeout: 20000
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = "";

        if (this.debug) {
          console.log("\n======== RAW RESPONSE HEADERS ========\n", res.headers);
        }

        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (this.debug) {
            console.log("\n======== RAW RESPONSE XML ========\n", data);
          }
          resolve(data);
        });
      });

      req.on("error", (err) => {
        if (this.debug) {
          console.error("\n========= SOAP ERROR =========");
          console.error(err.message);
        }
        reject(err);
      });

      req.on("timeout", () => {
        req.destroy(new Error("Request timed out"));
      });

      req.write(xml);
      req.end();
    });
  }
}

module.exports = AsanakSms;
