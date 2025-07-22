// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PuzzleGame {
    struct ScoreEntry {
        address player;
        uint256 level;
        uint256 timeTaken;
    }

    mapping(uint256 => ScoreEntry[]) public scoresPerLevel;

    event ScoreSubmitted(address indexed player, uint256 level, uint256 timeTaken);

    function submitScore(uint256 level, uint256 timeTaken) public {
        require(level > 0 && level <= 100, "Invalid level");
        require(timeTaken > 0, "Invalid time");

        scoresPerLevel[level].push(ScoreEntry(msg.sender, level, timeTaken));
        emit ScoreSubmitted(msg.sender, level, timeTaken);
    }

    function getTopScores(uint256 level) public view returns (ScoreEntry[] memory) {
        ScoreEntry[] memory scores = scoresPerLevel[level];
        uint256 len = scores.length;

        // Bubble sort (can be replaced with better sort off-chain)
        for (uint i = 0; i < len; i++) {
            for (uint j = i + 1; j < len; j++) {
                if (scores[i].timeTaken > scores[j].timeTaken) {
                    ScoreEntry memory temp = scores[i];
                    scores[i] = scores[j];
                    scores[j] = temp;
                }
            }
        }

        uint256 limit = len > 10 ? 10 : len;
        ScoreEntry[] memory top = new ScoreEntry[](limit);
        for (uint i = 0; i < limit; i++) {
            top[i] = scores[i];
        }

        return top;
    }
}
