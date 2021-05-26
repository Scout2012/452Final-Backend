# 452Final-Backend

Names of group members:
	Carlos Garcia
	Hounghuy Hourt
	Jacob Powell
	Angel Quiroga
	Kenneth Truong
	
Contributions of each members:
	Carlos Garcia
		Front-end and back-end
	  
	Hounghuy Hourt
		Documentation
	  Front-end
    
	Jacob Powell
		Front-end and back-end
	
	Angel Quiroga
		Documentation
    Testing
    Front-end
	
	Kenneth Truong
		Documentation
    Front-end

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

Setting up Mongo:
- Create a 'ServerKeys' and 'Stock' collection in MongoDB Compass
- import the 'Stock' and 'ServerKeys' files into the respective collections
- The rest of the collection will automatically be created when they're called by the code

Note:
We were not able to get the the actual encrypting and decrypting of the order functioning. 
While we know how to perform the process in theory, and even coded it (as seen in the 
various functions such as the verifyResponse function), there was difficulty with the encoding and decoding of the keys. We believe this was due to the way we were attempting to transmit and decode the keys between the server and the client, as it may have added extra characters to the keys.

Other limitations:
- 
