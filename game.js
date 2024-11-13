class Card {
    constructor(suit, value) {
        this.suit = suit;
        this.value = value;
    }

    toString() {
        const values = {
            11: 'J',
            12: 'Q',
            13: 'K',
            14: 'A',
            15: '2'
        };
        const suits = {
            'hearts': '♥',
            'diamonds': '♦',
            'clubs': '♣',
            'spades': '♠'
        };
        return `${values[this.value] || this.value}${suits[this.suit]}`;
    }

    isRed() {
        return this.suit === 'hearts' || this.suit === 'diamonds';
    }
}

class PresidentGame {
    constructor() {
        this.deck = [];
        this.players = [[], [], [], []];
        this.currentPlayer = 0;
        this.lastPlayed = [];
        this.passCount = 0;
        this.selectedCards = [];
        this.gameStatus = document.querySelector('.game-status');
        this.playButton = document.getElementById('playButton');
        this.passButton = document.getElementById('passButton');
        
        this.initializeDeck();
        this.dealCards();
        this.setupEventListeners();
        this.updateUI();
    }

    initializeDeck() {
        const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
        const values = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]; // 14 is Ace, 15 is 2
        
        for (let suit of suits) {
            for (let value of values) {
                this.deck.push(new Card(suit, value));
            }
        }
        
        // Shuffle deck
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    dealCards() {
        while (this.deck.length > 0) {
            for (let i = 0; i < 4; i++) {
                if (this.deck.length > 0) {
                    this.players[i].push(this.deck.pop());
                }
            }
        }
        
        // Sort each player's hand
        for (let hand of this.players) {
            hand.sort((a, b) => a.value - b.value);
        }
    }

    setupEventListeners() {
        this.playButton.addEventListener('click', () => this.playCards());
        this.passButton.addEventListener('click', () => this.pass());
    }

    updateUI() {
        // Update all players' cards
        for (let i = 0; i < 4; i++) {
            const playerArea = document.querySelector(`#player${i + 1} .player-cards`);
            playerArea.innerHTML = '';
            
            if (i === 0) { // Human player
                this.players[i].forEach((card, index) => {
                    const cardElement = document.createElement('div');
                    cardElement.className = `card ${card.isRed() ? 'red' : 'black'}`;
                    cardElement.textContent = card.toString();
                    cardElement.addEventListener('click', () => this.toggleCardSelection(index));
                    if (this.selectedCards.includes(index)) {
                        cardElement.classList.add('selected');
                    }
                    playerArea.appendChild(cardElement);
                });
            } else { // AI players
                this.players[i].forEach(() => {
                    const cardElement = document.createElement('div');
                    cardElement.className = 'card';
                    cardElement.textContent = '🂠';
                    playerArea.appendChild(cardElement);
                });
            }
        }

        // Update last played cards
        const lastPlayedArea = document.querySelector('.last-played');
        lastPlayedArea.innerHTML = '';
        this.lastPlayed.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.className = `card ${card.isRed() ? 'red' : 'black'}`;
            cardElement.textContent = card.toString();
            lastPlayedArea.appendChild(cardElement);
        });

        // Update buttons
        this.playButton.disabled = this.currentPlayer !== 0;
        this.passButton.disabled = this.currentPlayer !== 0;

        // Update game status
        this.gameStatus.textContent = this.currentPlayer === 0 ? 
            "Your turn!" : `Player ${this.currentPlayer + 1}'s turn`;
    }

    toggleCardSelection(index) {
        if (this.currentPlayer !== 0) return;

        const cardIndex = this.selectedCards.indexOf(index);
        if (cardIndex === -1) {
            this.selectedCards.push(index);
        } else {
            this.selectedCards.splice(cardIndex, 1);
        }
        this.updateUI();
    }

    isValidPlay(cards) {
        if (cards.length === 0) return false;
        
        // All selected cards must have the same value
        const firstValue = cards[0].value;
        if (!cards.every(card => card.value === firstValue)) return false;

        // If there are no last played cards, any play is valid
        if (this.lastPlayed.length === 0) return true;

        // Must play the same number of cards as last played
        if (cards.length !== this.lastPlayed.length) return false;

        // Cards must be higher value than last played
        return cards[0].value > this.lastPlayed[0].value;
    }

    playCards() {
        if (this.currentPlayer !== 0) return;

        const cards = this.selectedCards
            .sort((a, b) => b - a)
            .map(index => this.players[0][index]);

        if (!this.isValidPlay(cards)) {
            alert('Invalid play!');
            return;
        }

        // Remove played cards from hand
        for (let index of this.selectedCards.sort((a, b) => b - a)) {
            this.players[0].splice(index, 1);
        }

        this.lastPlayed = cards;
        this.selectedCards = [];
        this.passCount = 0;
        this.nextTurn();
    }

    pass() {
        if (this.currentPlayer !== 0) return;
        this.passCount++;
        this.selectedCards = [];
        this.nextTurn();

        if (this.passCount >= 3) {
            this.lastPlayed = [];
            this.passCount = 0;
        }
    }

    aiPlay() {
        const hand = this.players[this.currentPlayer];
        
        // Group cards by value
        const groups = {};
        hand.forEach(card => {
            groups[card.value] = (groups[card.value] || []).concat(card);
        });

        // Find valid plays
        let validPlay = null;
        if (this.lastPlayed.length === 0) {
            // Play lowest single card if no last played cards
            validPlay = [hand[0]];
        } else {
            // Find groups of same size as last played with higher value
            Object.values(groups).forEach(group => {
                if (group.length === this.lastPlayed.length && 
                    group[0].value > this.lastPlayed[0].value) {
                    if (!validPlay || group[0].value < validPlay[0].value) {
                        validPlay = group;
                    }
                }
            });
        }

        if (validPlay) {
            // Remove played cards from hand
            validPlay.forEach(card => {
                const index = hand.indexOf(card);
                hand.splice(index, 1);
            });
            this.lastPlayed = validPlay;
            this.passCount = 0;
        } else {
            this.passCount++;
            if (this.passCount >= 3) {
                this.lastPlayed = [];
                this.passCount = 0;
            }
        }

        this.nextTurn();
    }

    nextTurn() {
        this.currentPlayer = (this.currentPlayer + 1) % 4;
        this.updateUI();

        // Check for game over
        for (let i = 0; i < 4; i++) {
            if (this.players[i].length === 0) {
                alert(`Player ${i + 1} wins!`);
                return;
            }
        }

        // AI turns
        if (this.currentPlayer !== 0) {
            setTimeout(() => this.aiPlay(), 1000);
        }
    }
}

// Start the game when the page loads
window.onload = () => new PresidentGame(); 