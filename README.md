# sol-training-assignment1

**This project leverages hardhat framework**

this README contains how to run the code and also answer the additional tasks

## Setup

```shell
yarn install
```

## Run test cases

```shell
yarn hardhat compile

yarn hardhat test
```

## Additional tasks

### T1: Customized Player Numbers: Allow the Host to specify the number of Players upon deployment

```
Implemented in contract file GuessNumber.sol

and related test case in file GuessNumber.ts
```

### T2: Explain the reason of having both nonceHash and nonceNumHash in the smart contract. Can any of these two be omitted and why?

```
First of all, we should agree we need nonce in this guessing name. If we deployment
have nonce, players can easily check the number in the contract, despite the number
value is private. Even we store hash(number) in the contract, players can easily
brute force the hash value among 0-1000 to see which value is store in the contract
aka the answer.

We cannot store plain text of nonce and nonce+num in the contract. Again, all storage
variables are readable in the contract.

We should store both nonceHash and nonceNumHash without missing one or another. Lets say
we dont have nonceHash, then we cannot ensure when host calls reveal, he is using the
right nonce to calculate nonceNumHash, which is hash(nonce + number), or luckily the
host found two sets of nonce + number that generates the same hash, then the game is tampered
by the host and the players will never know. If we dont have nonceNumHash, storing
nonce + number or hash(number) are not alternative options. That is, we need both
nonceHash and nonceNumHash.
```

### T3: Try to find out any security loopholes in the above design and propose an improved solution.

```
Since the contract is implemented for multi player,
there are two ways to store the player address, one is to use dynamic size of the array,
another is to use fixed size array. The problem of the fixed size array is that the
attacker can create multiple addresses and try to front run all other players' transaction
to occupy all limited seats, then the attacker can get the host initial deposit reward.
If we use dynamic size array (we dont consider the attacker wants to DDOS the contract Since
he will put a lot of ether in order to participate with multiple addresses) we want to also
make sure when claiming the reward, we should follow the withdraw reward approach instead
of make direct transfer in the reveal function and also use the Checks Effects Interaction pattern
to the reveal function, since potentially the attacker could front run the host transaction and
make reentrancy attack.
```
