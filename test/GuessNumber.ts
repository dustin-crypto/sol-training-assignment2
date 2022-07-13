import { expect } from "chai";
import { ethers } from "hardhat";

describe("Guess Number", async () => {
  let nonce: string;

  beforeEach(async () => {
    const makeNonce = (length: number) => {
      var result = "";
      var characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      var charactersLength = characters.length;
      for (var i = 0; i < length; i++) {
        result += characters.charAt(
          Math.floor(Math.random() * charactersLength)
        );
      }
      return result;
    };

    const length = Math.floor(Math.random() * 16) + 1;
    nonce = makeNonce(length);
    expect(Buffer.from(nonce).toString("hex").length <= 32).to.be.true;
  });

  it("Test case 1: player2 wins 3 ether as rewards", async () => {
    const number = 999;
    console.log("SET Nonce:", nonce, ", Number:", number);
    const [host, player1, player2, player3] = await ethers.getSigners();
    const deposit = ethers.utils.parseEther("1.0");
    const GuessNumber = await ethers.getContractFactory("GuessNumber");
    const guessNumber = await GuessNumber.deploy(
      ethers.utils.keccak256(ethers.utils.formatBytes32String(nonce)),
      ethers.utils.keccak256(
        ethers.utils.hexConcat([
          ethers.utils.formatBytes32String(nonce),
          ethers.utils.hexlify(number),
        ])
      ),
      2,
      {
        value: deposit,
      }
    );
    await guessNumber.deployed();

    expect(await ethers.provider.getBalance(guessNumber.address)).to.equal(
      deposit
    );

    // make guesses
    const p1Tx = await guessNumber
      .connect(player1)
      .guess(800, { value: deposit });
    await p1Tx.wait();

    // try wrong guesses format
    await expect(
      guessNumber.connect(player2).guess(10000, { value: deposit })
    ).to.be.revertedWith("Invalid number input");
    await expect(
      guessNumber
        .connect(player2)
        .guess(900, { value: ethers.utils.parseEther("1.5") })
    ).to.be.revertedWith("Should deposit the same value");

    const p2Tx = await guessNumber
      .connect(player2)
      .guess(900, { value: deposit });
    await p2Tx.wait();

    // unavailable to guess again
    await expect(
      guessNumber.connect(player2).guess(910, { value: deposit })
    ).to.be.revertedWith("Player already picked");
    await expect(
      guessNumber.connect(player2).guess(900, { value: deposit })
    ).to.be.revertedWith("Number already guessed");
    // exceed max player
    await expect(
      guessNumber.connect(player3).guess(799, { value: deposit })
    ).to.be.revertedWith("Exceed max players");

    const p1Balance = await player1.getBalance();
    const p2Balance = await player2.getBalance();

    // reveal
    const revealTx = await guessNumber.reveal(
      ethers.utils.formatBytes32String(nonce),
      number
    );
    await revealTx.wait();

    expect(await ethers.provider.getBalance(guessNumber.address)).to.equal(0);
    expect((await player1.getBalance()).eq(p1Balance)).to.be.true;
    expect(
      (await player2.getBalance()).eq(
        p2Balance.add(ethers.utils.parseEther("3.0"))
      )
    ).to.be.true;
    expect(await guessNumber.gameOver()).to.equal(true);

    // try to make action after game over
    expect(guessNumber.connect(player1).guess(100)).to.be.revertedWith(
      "Game has ended"
    );
    expect(
      guessNumber.reveal(ethers.utils.formatBytes32String(nonce), number)
    ).to.be.revertedWith("Game has ended");
  });

  it("Test case 2: Player1 input reverted", async () => {
    const number = 999;
    console.log("SET Nonce:", nonce, ", Number:", number);
    const [host, player1] = await ethers.getSigners();
    const deposit = ethers.utils.parseEther("1.0");
    const GuessNumber = await ethers.getContractFactory("GuessNumber");
    const guessNumber = await GuessNumber.deploy(
      // ethers.utils.id(nonce),
      // ethers.utils.id(nonce + number),
      ethers.utils.keccak256(ethers.utils.formatBytes32String(nonce)),
      ethers.utils.keccak256(
        ethers.utils.hexConcat([
          ethers.utils.formatBytes32String(nonce),
          ethers.utils.hexlify(number),
        ])
      ),
      2,
      {
        value: deposit,
      }
    );
    await guessNumber.deployed();

    expect(await ethers.provider.getBalance(guessNumber.address)).to.equal(
      deposit
    );
    expect(
      guessNumber
        .connect(player1)
        .guess(50, { value: ethers.utils.parseEther("2.0") })
    ).to.be.revertedWith("Should deposit the same value");
  });

  it("Test case 3: both player1 and player2 wins reward evenly", async () => {
    const number = 500;
    console.log("SET Nonce:", nonce, ", Number:", number);
    const [host, player1, player2] = await ethers.getSigners();
    const deposit = ethers.utils.parseEther("1.0");
    const GuessNumber = await ethers.getContractFactory("GuessNumber");
    const guessNumber = await GuessNumber.deploy(
      ethers.utils.keccak256(ethers.utils.formatBytes32String(nonce)),
      ethers.utils.keccak256(
        ethers.utils.hexConcat([
          ethers.utils.formatBytes32String(nonce),
          ethers.utils.hexlify(number),
        ])
      ),
      2,
      {
        value: deposit,
      }
    );
    await guessNumber.deployed();

    expect(await ethers.provider.getBalance(guessNumber.address)).to.equal(
      deposit
    );

    // make guesses
    const p1Tx = await guessNumber
      .connect(player1)
      .guess(450, { value: deposit });
    await p1Tx.wait();
    const p2Tx = await guessNumber
      .connect(player2)
      .guess(550, { value: deposit });
    await p2Tx.wait();

    const p1Balance = await player1.getBalance();
    const p2Balance = await player2.getBalance();

    // reveal
    const revealTx = await guessNumber.reveal(
      ethers.utils.formatBytes32String(nonce),
      number
    );
    await revealTx.wait();

    expect(await ethers.provider.getBalance(guessNumber.address)).to.equal(0);
    expect(
      (await player1.getBalance()).eq(
        p1Balance.add(ethers.utils.parseEther("1.5"))
      )
    ).to.be.true;
    expect(
      (await player2.getBalance()).eq(
        p2Balance.add(ethers.utils.parseEther("1.5"))
      )
    ).to.be.true;
    expect(await guessNumber.gameOver()).to.equal(true);
  });

  it("Test case 4: deposit evenly distributed", async () => {
    console.log("SET Nonce:", nonce, ", Number:", 1001);
    const [host, player1, player2] = await ethers.getSigners();
    const deposit = ethers.utils.parseEther("1.0");
    const GuessNumber = await ethers.getContractFactory("GuessNumber");

    // console.debug('input padded nonce:', ethers.utils.formatBytes32String(nonce));
    // console.debug('input padded nonce hashed:', ethers.utils.keccak256(ethers.utils.formatBytes32String(nonce)))
    // console.debug('input padded nonce concat number:', ethers.utils.formatBytes32String(nonce) + 1001);
    // console.debug('input padded nonce concat number hashed:', ethers.utils.keccak256(ethers.utils.formatBytes32String(nonce) + 1001))

    const guessNumber = await GuessNumber.deploy(
      ethers.utils.keccak256(ethers.utils.formatBytes32String(nonce)),
      ethers.utils.keccak256(
        ethers.utils.hexConcat([
          ethers.utils.formatBytes32String(nonce),
          ethers.utils.hexlify(1001),
        ])
      ),
      2,
      {
        value: deposit,
      }
    );
    await guessNumber.deployed();

    expect(await ethers.provider.getBalance(guessNumber.address)).to.equal(
      deposit
    );

    // make guesses
    const p1Tx = await guessNumber
      .connect(player1)
      .guess(50, { value: deposit });
    await p1Tx.wait();
    const p2Tx = await guessNumber
      .connect(player2)
      .guess(60, { value: deposit });
    await p2Tx.wait();

    const p1Balance = await player1.getBalance();
    const p2Balance = await player2.getBalance();

    // reveal
    const revealTx = await guessNumber.reveal(
      ethers.utils.formatBytes32String(nonce),
      1001
    );
    await revealTx.wait();

    expect(await ethers.provider.getBalance(guessNumber.address)).to.equal(0);
    expect((await player1.getBalance()).gt(p1Balance)).to.be.true;
    expect((await player2.getBalance()).gt(p2Balance)).to.be.true;
    expect(await guessNumber.gameOver()).to.equal(true);
  });

  it("Test case 5: 3 players, player2 wins 4 ether as rewards", async () => {
    let number = 999;
    console.log("SET Nonce:", nonce, ", Number:", number);
    const [host, player1, player2, player3] = await ethers.getSigners();
    const deposit = ethers.utils.parseEther("1.0");
    const GuessNumber = await ethers.getContractFactory("GuessNumber");
    const guessNumber = await GuessNumber.deploy(
      ethers.utils.keccak256(ethers.utils.formatBytes32String(nonce)),
      ethers.utils.keccak256(
        ethers.utils.hexConcat([
          ethers.utils.formatBytes32String(nonce),
          ethers.utils.hexlify(number),
        ])
      ),
      3, // players count
      {
        value: deposit,
      }
    );
    await guessNumber.deployed();

    expect(await ethers.provider.getBalance(guessNumber.address)).to.equal(
      deposit
    );

    // make guesses
    const p1Tx = await guessNumber
      .connect(player1)
      .guess(800, { value: deposit });
    await p1Tx.wait();
    const p2Tx = await guessNumber
      .connect(player2)
      .guess(900, { value: deposit });
    await p2Tx.wait();
    const p3Tx = await guessNumber
      .connect(player3)
      .guess(500, { value: deposit });
    await p3Tx.wait();

    const p1Balance = await player1.getBalance();
    const p2Balance = await player2.getBalance();

    // reveal
    const revealTx = await guessNumber.reveal(
      ethers.utils.formatBytes32String(nonce),
      number
    );
    await revealTx.wait();

    expect(await ethers.provider.getBalance(guessNumber.address)).to.equal(0);
    expect((await player1.getBalance()).eq(p1Balance)).to.be.true;
    expect(
      (await player2.getBalance()).eq(
        p2Balance.add(ethers.utils.parseEther("4.0"))
      )
    ).to.be.true;
    expect(await guessNumber.gameOver()).to.equal(true);

    // try to make action after game over
    expect(guessNumber.connect(player1).guess(100)).to.be.revertedWith(
      "Game has ended"
    );
    expect(
      guessNumber.reveal(ethers.utils.formatBytes32String(nonce), number)
    ).to.be.revertedWith("Game has ended");
  });
});
