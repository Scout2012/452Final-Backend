# 452Final-Backend

Prerequisites:
- [MongoDB](https://docs.mongodb.com/manual/installation/)
- Make sure to have mongo running on port 27017 while attempting to run this project

How To Install:
- git clone
- cd 452Final-Backend
- npm install
- npm install -g ts-node

Running:
- ts-node server.ts // Runs on port 8000

Note:
We were not able to get the the actual encrypting and decrypting of the order functioning. 
While we know how to perform the process in theory, and even coded it (as seen in the 
various functions such as the verifyResponse function), there was difficulty with the encoding and decoding of the keys. We believe this was due to the way we were attempting to transmit and decode the keys between the server and the client, as it may have added extra characters to the keys.

Other limitations:
- 
