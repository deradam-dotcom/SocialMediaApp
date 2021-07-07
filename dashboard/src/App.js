import "./App.css";
import React, { useState } from "react";

function App() {
  let [tweets, setTweets] = useState([]);

  let getTweets = async () => {
    let response = await fetch("http://localhost:5000/twitter");
    let data = await response.json();
    let newTweets = [...data];
    setTweets(newTweets);
  };

  setInterval(getTweets(), 8000);

  return (
    <div className="App">
      {tweets.map((tweet, index) => (
        <ul key={index}>
          <li>
            {" "}
            {index} {tweet.data.text}
          </li>
        </ul>
      ))}
    </div>
  );
}

export default App;
