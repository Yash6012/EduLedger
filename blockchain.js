const crypto = require('crypto');

class Block {
    constructor(timestamp, data, previousHash = '') {
        this.timestamp = timestamp;
        this.data = data;
        this.previousHash = previousHash;
        this.hash = this.calculateHash();
        this.nonce = 0;
    }

    calculateHash() {
        return crypto
            .createHash('sha256')
            .update(
                this.timestamp +
                JSON.stringify(this.data) +
                this.previousHash +
                this.nonce
            )
            .digest('hex');
    }

    mineBlock(difficulty) {
        while (
            this.hash.substring(0, difficulty) !== Array(difficulty + 1).join('0')
        ) {
            this.nonce++;
            this.hash = this.calculateHash();
        }
        console.log(`Block mined: ${this.hash}`);
    }

    isValid() {
        return this.hash === this.calculateHash();
    }
}

class Blockchain {
    constructor() {
        this.chain = [this.createGenesisBlock()];
        this.difficulty = 4; // Adjust difficulty as needed
    }

    createGenesisBlock() {
        return new Block(
            Date.now(),
            {
                studentId: '0',
                subject: 'Genesis',
                grade: 'A',
                facultyId: '0'
            },
            '0'
        );
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    addBlock(data) {
        const newBlock = new Block(
            Date.now(),
            data,
            this.getLatestBlock().hash
        );
        newBlock.mineBlock(this.difficulty);
        this.chain.push(newBlock);
        return newBlock;
    }

    isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            if (!currentBlock.isValid()) {
                return false;
            }

            if (currentBlock.previousHash !== previousBlock.hash) {
                return false;
            }
        }
        return true;
    }

    getBlock(hash) {
        return this.chain.find(block => block.hash === hash);
    }

    getBlocksByStudent(studentId) {
        return this.chain.filter(block => 
            block.data.studentId === studentId
        );
    }

    // Additional helper methods
    getBlockByData(data) {
        return this.chain.find(block => 
            JSON.stringify(block.data) === JSON.stringify(data)
        );
    }

    getBlocksByFaculty(facultyId) {
        return this.chain.filter(block => 
            block.data.facultyId === facultyId
        );
    }

    getBlocksBySubject(subject) {
        return this.chain.filter(block => 
            block.data.subject === subject
        );
    }
}

// Export the classes
module.exports = {
    Block,
    Blockchain
}; 