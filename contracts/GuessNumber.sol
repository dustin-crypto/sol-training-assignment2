pragma solidity ^0.8.0;

contract GuessNumber {
    bytes32 public nonceHash;
    bytes32 public nonceNumHash;
    uint256 public initDeposit;
    uint256 public playersCount;
    uint256 public playersSubmitted = 0;
    address payable[] public players;
    address payable[] public rewardWinner;
    bool public gameOver = false;
    mapping(address => bool) public playersGuess;
    mapping(address => uint16) public playersNumber;
    mapping(uint16 => bool) public numberGuessed;

    constructor(bytes32 _nonceHash, bytes32 _nonceNumHash, uint256 _playersCount) payable {
        require(msg.value > 0, "No deposit amount to initial this contract");
        nonceHash = _nonceHash;
        nonceNumHash = _nonceNumHash;
        playersCount = _playersCount;
        initDeposit = msg.value;
    }

    function guess(uint16 number) external payable {
        require(!gameOver, "Game has ended");
        require(!numberGuessed[number], "Number already guessed");
        require(!playersGuess[msg.sender], "Player already picked");
        require(0 <= number && number < 1000, "Invalid number input");
        require(initDeposit == msg.value, "Should deposit the same value");
        require(playersSubmitted < playersCount, "Exceed max players");

        playersSubmitted++;
        playersGuess[msg.sender] = true;
        playersNumber[msg.sender] = number;
        numberGuessed[number] = true;
        players.push(payable(msg.sender));
    }

    function reveal(bytes32 nonce, uint16 number) external {
        require(!gameOver, "Game has ended");
        require(keccak256(abi.encodePacked(nonce)) == nonceHash, "Wrong nonce");
        require(keccak256(abi.encodePacked(nonce, bytes2(number))) == nonceNumHash, "Wrong nonce + number");

        gameOver = true;

        if (number < 0 || number >= 1000) {
            uint256 rewardPortion = address(this).balance / players.length;
            for (uint256 i = 0; i < players.length; i++) {
                players[i].transfer(rewardPortion);
            }
        } else {
            uint16 min = 2**16-1;
            for (uint256 i = 0; i < playersCount; i++) {
                uint16 diff = _uintdiff(playersNumber[players[i]], number);
                if (diff < min) {
                    min = diff;
                }
            }
            for (uint256 i = 0; i < playersCount; i++) {
                uint16 diff = _uintdiff(playersNumber[players[i]], number);
                if (diff == min) {
                    rewardWinner.push(players[i]);
                }
            }
            uint256 rewardPortion = address(this).balance / rewardWinner.length;
            for (uint256 i = 0; i < rewardWinner.length; i++) {
                rewardWinner[i].transfer(rewardPortion);
            }
        }
    }

    function _uintdiff(uint16 a, uint16 b) private pure returns(uint16) {
        return a > b ? a - b : b - a;
    }
}
