# Draw-Guess ✏️

### 🔗 Website : https://jasmin-draw.com/

### Test account and password: 
* jasmin@gmail.com / 1213
* lulu@gmail.com / 1213
* momo@gmail.com / 1213
* ray@gmail.com / 1213

## Game Intro

Draw-Guess is a multiplayer online game for friends and families all around the world! As one player being the artist, other players take guesses and typing the right answer to win point. Everyone gets a chance to be his/hers own artist each round! The first player getting goal points is the winner of the game.

Draw-Guess allows players to create thier own room and invite up to 50 friends by the link provided. Just get started and show friends your masterpiece! :)

## 🔖 Catalog
* [Main Features](#main-features)
* [Backend Technique](#backend-technique)
  * [Infrastructure](#infrastructure)
  * [Environment](#environment)
  * [Library](#library)
  * [Database](#database)
  * [Cloud Service](#cloud-service)
  * [Version Control](#version-control)
  * [Networking](#networking)
* [Frontend Technique](#frontend-technique)
* [Scalable System](#scalable-system)
* [Artictecture](#artictecture)
  * [Backend Artictecture](#backend-artictecture)
  * [Message Flow of Room System](#message-flow-of-room-system)
  * [Message Flow of Game System](#message-flow-of-game-system)
* [Contact](#contact)

## Main Features
* Use Socket.IO for real time drawing, chatting and guessing.

![未命名2拷貝](https://user-images.githubusercontent.com/110441965/222968145-7bcfa219-f28a-412d-b585-65e88986a98c.gif)

* Multiple Player Online
  * One player acts as the artist while the other players take turns guessing and typing the correct answer to earn points.
  * If the drawer leaves the room, an intermission will be called and the next player will take over.
  * If the host leaves the room, the next player will become the host.
  * Multiple players can guess correctly in each round, and when everyone has guessed correctly, an intermission will be called.
  * The player who reaches the goal will be declared the winner.
 
![draw11](https://user-images.githubusercontent.com/110441965/222966361-9533dc8a-2668-4dfa-98e2-2552d5c5e195.gif)

* Multiple Room Online
  * Players can create public rooms, and other players can enter the room from the lobby. Alternatively, they can create a private room, share the link, and invite friends to join.

![draw13](https://user-images.githubusercontent.com/110441965/222966689-0f83aa66-ad3b-4aba-9096-b0266c3c6dab.gif)

## Backend Technique
### Infrastructure
* Docker

### Environment
* Node.js
* Express.js

### Library
* Socket.IO
* Socket.IO/ Redis adapter

### Database
* MySQL
* Redis

### Cloud Service
* AWS EC2
* AWS Elastic Load Balancer
* AWS Auto Scaling
* AWS RDS
* AWS ElastiCache

### Version Control
* Git
* GitHub

### Networking
* Nginx
* SSL

## Frontend Technique
* HTML
* CSS
* JavaScript
* HTML5 Canvas

## Scalable System
* Use redis adapter to realize the function of emitting messages between different servers.
* AWS ELB can distribute incoming traffic across multiple servers.
<img width="846" alt="image" src="https://user-images.githubusercontent.com/110441965/223946631-8fe4d589-45b6-4939-a20b-70dd76c65e8b.png">

* Monitoring metrics from instances and auto scaling group using AWS CloudWatch.
* AWS Auto Scaling enables horizontal scaling based on AWS CloudWatch Alarms.
  * One instance is added when average CPU utilization approaches 50%.
<img width="398" alt="image" src="https://user-images.githubusercontent.com/110441965/223951558-cf2fcc51-873e-4354-a388-c81afa2d217e.png">

## Artictecture
### Backend Artictecture
<img width="846" alt="image" src="https://user-images.githubusercontent.com/110441965/223435989-6e7f1b3c-24b6-49bb-bf83-f01d63ef0f8e.png">

### Message Flow of Room System
<img width="846" alt="image" src="https://user-images.githubusercontent.com/110441965/223493418-0874e11d-0c3b-4d8e-809f-8d7051fe44ce.png">

### Message Flow of Game System
<img width="846" alt="image" src="https://user-images.githubusercontent.com/110441965/223493525-270ac904-3e99-4932-9a6f-43ef21faf993.png">

## Contact
* 傅雅得 Jasmin Fu
* 📪 Email : ytfu1213@gmail.com
