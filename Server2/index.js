const express = require("express");
const app = express();
const cors = require("cors");
const fs = require("fs");
const PORT = process.env.PORT || 5000;
const needle = require("needle");
const http = require("https");
const token =
  "AAAAAAAAAAAAAAAAAAAAAGKeRAEAAAAA8ku%2BaWATOb0WAmsH7tzUMrKSUdc%3DGM5H99ajAw6bNeH82LrSVSiPX6CuKM7i2Pekl8Y6DjJhiBT6nX";
const rulesURL = "https://api.twitter.com/2/tweets/search/stream/rules";
const streamURL = "https://api.twitter.com/2/tweets/search/stream";

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

var freshTweets = [];
app.get("/twitter", (req, res) => {
  res.json(freshTweets);
});

//*****************************TWITTER*****************************//
// Open a realtime stream of Tweets, filtered according to rules
// https://developer.twitter.com/en/docs/twitter-api/tweets/filtered-stream/quick-start

// The code below sets the bearer token from your environment variables
// To set environment variables on macOS or Linux, run the export command below from the terminal:
// export BEARER_TOKEN='YOUR-TOKEN'

// this sets up two rules - the value is the search terms to match on, and the tag is an identifier that
// will be applied to the Tweets return to show which rule they matched
// with a standard project with Basic Access, you can add up to 25 concurrent rules to your stream, and
// each rule can be up to 512 characters long

// Edit rules as desired below

//
const rules = [
  {
    value: "#AustrianGP",
    tag: "#AustrianGP",
  },
];

async function getAllRules() {
  const response = await needle("get", rulesURL, {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  if (response.statusCode !== 200) {
    console.log("Error:", response.statusMessage, response.statusCode);
    throw new Error(response.body);
  }

  return response.body;
}

async function deleteAllRules(rules) {
  if (!Array.isArray(rules.data)) {
    return null;
  }

  const ids = rules.data.map((rule) => rule.id);

  const data = {
    delete: {
      ids: ids,
    },
  };

  const response = await needle("post", rulesURL, data, {
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
  });

  if (response.statusCode !== 200) {
    throw new Error(response.body);
  }

  return response.body;
}

async function setRules() {
  const data = {
    add: rules,
  };

  const response = await needle("post", rulesURL, data, {
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
  });

  if (response.statusCode !== 201) {
    throw new Error(response.body);
  }

  return response.body;
}

function streamConnect(retryAttempt) {
  const stream = needle.get(streamURL, {
    headers: {
      "User-Agent": "v2FilterStreamJS",
      Authorization: `Bearer ${token}`,
    },
    timeout: 20000,
  });

  stream
    .on("data", (data) => {
      try {
        const json = JSON.parse(data);
        //console.log(json);

        freshTweets.push(json);
        console.log("**********TWEETS************", freshTweets);

        // A successful connection resets retry count.
        retryAttempt = 0;
      } catch (e) {
        if (
          data.detail ===
          "This stream is currently at the maximum allowed connection limit."
        ) {
          console.log(data.detail);
          process.exit(1);
        } else {
          // Keep alive signal received. Do nothing.
        }
      }
    })
    .on("err", (error) => {
      if (error.code !== "ECONNRESET") {
        console.log(error.code);
        process.exit(1);
      } else {
        // This reconnection logic will attempt to reconnect when a disconnection is detected.
        // To avoid rate limits, this logic implements exponential backoff, so the wait time
        // will increase if the client cannot reconnect to the stream.
        setTimeout(() => {
          console.warn("A connection error occurred. Reconnecting...");
          streamConnect(++retryAttempt);
        }, 2 ** retryAttempt);
      }
    });

  return stream;
}

(async () => {
  let currentRules;

  try {
    // Gets the complete list of rules currently applied to the stream
    currentRules = await getAllRules();

    // Delete all rules. Comment the line below if you want to keep your existing rules.
    await deleteAllRules(currentRules);

    // Add rules to the stream. Comment the line below if you don't want to add new rules.
    await setRules();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }

  // Listen to the stream.
  streamConnect(0);
})();

//*********************INSTAGRAM*************************//
const options = {
  method: "GET",
  hostname: "instagram85.p.rapidapi.com",
  port: null,
  path: "/tag/austriangp/feed",
  headers: {
    "x-rapidapi-key": "90b5d298b3msh73aefaa5bb36a9ep1414dbjsn6bca92f1d248",
    "x-rapidapi-host": "instagram85.p.rapidapi.com",
    useQueryString: true,
  },
};

const req = http.request(options, function (res) {
  const chunks = [];

  res.on("data", function (chunk) {
    chunks.push(chunk);
  });

  res.on("end", function () {
    const body = Buffer.concat(chunks);
    //console.log(JSON.parse(body));
    //let instaArray = JSON.parse(body);
    //instaArray.data.map((item) => console.log(item.id));
  });
});

req.end();

//***********************FACEBOOK******************************/

/*var options = {
    host: 'graph.facebook.com',
    path: '/pages/search?q=Formula1&fields=id,name,location,link&access_token=1271831203234458|Y8O1ZmNaPmHSynrPsqGluI_nOro'
};
http.get(options,function(res){
    var data = '';

    res.on('data', function (chunk) {
        data += chunk;
    });

    res.on('end', function() {
        console.log(data);
    });
});*/
app.listen(PORT, () => {
  console.log(`Server is now listening ${PORT}`);
});
