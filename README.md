# 452Final


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
		Documentation and front-end
		
	Jacob Powell
		Front-end and back-end
	
	Angel Quiroga
		Documentation, testing, and front-end
	
	Kenneth Truong
		Documentation and front-end

Prerequisites:
- Node
- MongoDb

How To Install:
- git clone
- npm install
- cd 452Final
- npm install -g ts-node

Running:
- sudo ts-node server.ts // We're running on port 80, so we need sudo to do this.

Note:
We were not able to get the the actual encrypting and decrypting of the order functioning. 
While we know how to perform the process in theory, and even coded it (as seen in the 
various functions such as the verifyResponse function), there was difficulty with the encoding and decoding of the keys. We believe this was due to the way we were attempting to transmit and decode the keys between the server and the client, as it may have added extra characters to the keys.
