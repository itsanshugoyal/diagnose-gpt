// import OpenAI from "openai";
const OpenAI = require("openai");

async function main(e) {
  var data = document.getElementById("input_symp").value;
  console.log(data);

  const completion = await openai.chat.completions.create({
    messages: [{ role: "system", content: "You are a helpful assistant." }],
    model: "gpt-3.5-turbo",
  });

  console.log(completion.choices[0]);
}

main();
