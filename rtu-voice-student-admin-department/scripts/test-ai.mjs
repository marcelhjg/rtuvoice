import { analyzeComplaint } from "../src/features/ai/analyzeComplaint.ts";


const result = await analyzeComplaint({
  title: "Slow campus Wi-Fi in the library",
  description:
    "My name is Paolo Reyes from BSCS 2-1. For the past month the Wi-Fi in the library is very slow and disconnects often, especially from 1PM to 4PM. I can't submit my online requirements on time and I have to go to a cafe to finish them. Our instructor, Prof. Dela Cruz, has allowed late submission for now, but other students are also affected. Please check the network.",
});

  if (result){
    console.log(`Successful!\nAI Title:${result.title}\nAI Summary:${result.summary}\nAI Priority:${result.priority}`)
    if (result.notes) console.log(result.notes)
  } else {
    console.log("All models failed (check the [ai] errors above).");
  }
