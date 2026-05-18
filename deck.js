/**
 * Deck - Standard casino 6-deck shoe
 */
class Deck {
    constructor() {
        this.cards = [];
        this.discardPile = [];
        this.reshuffle();
    }

    reshuffle() {
        this.cards = [];
        const suits = ['♠', '♥', '♦', '♣'];
        const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        
        // 6-deck shoe
        for (let deck = 0; deck < 6; deck++) {
            for (let suit of suits) {
                for (let rank of ranks) {
                    this.cards.push({ rank, suit });
                }
            }
        }
        
        this.shuffle();
    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    draw() {
        if (this.cards.length < 75) {
            // Reshuffle when penetration reaches 75%
            this.cards = this.discardPile;
            this.discardPile = [];
            this.shuffle();
        }
        return this.cards.pop();
    }

    discard(card) {
        this.discardPile.push(card);
    }
}

/**
 * Hand - Individual player or dealer hand
 */
class Hand {
    constructor() {
        this.cards = [];
        this.bet = 0;
        this.status = null; // null, 'blackjack', 'bust', 'stand', 'splitAce', 'double', 'win', 'loss', 'push'
        this.isSplitHand = false;
        this.isAceSplit = false;
    }

    addCard(card) {
        this.cards.push(card);
    }

    getCards() {
        return this.cards;
    }

    getValue() {
        let value = 0;
        let aces = 0;

        for (let card of this.cards) {
            if (card.rank === 'A') {
                aces += 1;
                value += 11;
            } else if (['J', 'Q', 'K'].includes(card.rank)) {
                value += 10;
            } else {
                value += parseInt(card.rank);
            }
        }

        // Adjust for aces if busted
        while (value > 21 && aces > 0) {
            value -= 10;
            aces -= 1;
        }

        return value;
    }

    isBusted() {
        return this.getValue() > 21;
    }

    /**
     * True blackjack: only 21 with exactly 2 cards, not from a split
     */
    isBlackjack() {
        if (this.cards.length !== 2) return false;
        if (this.getValue() !== 21) return false;
        if (this.isSplitHand) return false; // No blackjack from splits
        if (this.isAceSplit) return false;  // No blackjack from Ace splits
        
        // Must be Ace + 10-value card
        const hasAce = this.cards.some(c => c.rank === 'A');
        const hasTenValue = this.cards.some(c => ['10', 'J', 'Q', 'K'].includes(c.rank));
        return hasAce && hasTenValue;
    }

    /**
     * Can split pairs, including 10-value cards (10, J, Q, K all same value)
     */
    isPair() {
        if (this.cards.length !== 2) return false;

        const rank1 = this.cards[0].rank;
        const rank2 = this.cards[1].rank;

        // Exact rank match
        if (rank1 === rank2) return true;

        // 10-value cards can split together
        const tenValues = ['10', 'J', 'Q', 'K'];
        if (tenValues.includes(rank1) && tenValues.includes(rank2)) return true;

        return false;
    }

    canSplit() {
        // Cannot split if: not 2 cards, not a pair, already resolved, or is split Ace
        if (this.cards.length !== 2) return false;
        if (!this.isPair()) return false;
        if (this.status !== null) return false;
        if (this.isAceSplit) return false; // Cannot re-split Aces
        
        return true;
    }

    canDouble() {
        // Can only double on initial 2 cards
        return this.cards.length === 2 && this.status === null;
    }

    canHit() {
        // Can hit if: hand not busted and not standing
        // Cannot hit split Aces (they get exactly 1 card)
        if (this.isAceSplit) return false;
        if (this.getValue() >= 21) return false;
        if (this.status !== null && this.status !== 'double') return false;
        return true;
    }

    stand() {
        this.status = 'stand';
    }

    clear() {
        this.cards = [];
        this.status = null;
        this.isSplitHand = false;
        this.isAceSplit = false;
    }
}

/**
 * Game - Main game logic
 */
class Game {
    constructor() {
        this.deck = new Deck();
        this.dealer = new Hand();
        this.seats = Array(5).fill(null).map(() => [new Hand()]);
        this.currentSeat = null;
        this.currentHandIndex = null;
        this.gameState = 'betting'; // 'betting', 'playing', 'dealerTurn', 'results'
        this.bets = Array(5).fill(0);
        
        // Game rules - casino standard
        this.rules = {
            dealerHitsSoft17: true,    // H17 - dealer hits on soft 17
            doubleAfterSplit: true,    // DAS - can double after split
            resplitAces: false,         // Cannot re-split Aces
            doubleOnAnySplit: true      // Can double on any split hand
        };
    }

    placeBet(seatIndex, amount) {
        if (this.gameState !== 'betting') {
            return false;
        }
        this.bets[seatIndex] += amount;
        return true;
    }

    clearBet(seatIndex) {
        if (this.gameState !== 'betting') {
            return false;
        }
        this.bets[seatIndex] = 0;
        return true;
    }

    getBet(seatIndex) {
        return this.bets[seatIndex];
    }

    deal() {
        // Reset game
        this.dealer.clear();
        this.seats.forEach(hands => {
            hands.forEach(hand => hand.clear());
            hands.length = 1;
        });

        this.gameState = 'playing';

        // Deal initial cards - 2 to each active seat
        for (let seat = 0; seat < 5; seat++) {
            if (this.bets[seat] > 0) {
                const hand = this.seats[seat][0];
                hand.addCard(this.deck.draw());
                hand.addCard(this.deck.draw());

                if (hand.isBlackjack()) {
                    hand.status = 'blackjack';
                }
            }
        }

        // Dealer gets one card face-up, one face-down
        this.dealer.addCard(this.deck.draw()); // Face-up (visible)
        this.dealer.addCard(this.deck.draw()); // Face-down (hole card)

        // Set current seat to first active seat
        this.nextActiveHand();
    }

    nextActiveHand() {
        if (this.gameState !== 'playing') return false;

        // Find next hand that needs action
        for (let seat = 0; seat < 5; seat++) {
            if (this.bets[seat] === 0) continue;

            for (let handIdx = 0; handIdx < this.seats[seat].length; handIdx++) {
                const hand = this.seats[seat][handIdx];
                // Hand needs action if: status is null or 'double' (just doubled, needs to stand automatically)
                if (hand.status === null || hand.status === 'double') {
                    this.currentSeat = seat;
                    this.currentHandIndex = handIdx;
                    return true;
                }
            }
        }

        // No more hands to play - dealer's turn
        this.playDealer();
        return false;
    }

    getCurrentHand() {
        if (this.currentSeat === null) return null;
        return this.seats[this.currentSeat][this.currentHandIndex];
    }

    hit() {
        const hand = this.getCurrentHand();
        if (!hand || !hand.canHit()) return false;

        hand.addCard(this.deck.draw());

        if (hand.isBusted()) {
            hand.status = 'bust';
            this.nextActiveHand();
        }

        return true;
    }

    stand() {
        const hand = this.getCurrentHand();
        if (!hand) return false;

        hand.stand();
        this.nextActiveHand();
        return true;
    }

    doubleDown() {
        const hand = this.getCurrentHand();
        if (!hand || !hand.canDouble()) return false;

        // Check if double after split is allowed
        if (this.seats[this.currentSeat].length > 1 && !this.rules.doubleAfterSplit) {
            return false;
        }

        this.bets[this.currentSeat] *= 2;
        hand.addCard(this.deck.draw());

        if (hand.isBusted()) {
            hand.status = 'bust';
        } else {
            hand.status = 'double'; // Double status means automatic stand after this
        }

        this.nextActiveHand();
        return true;
    }

    split() {
        const hand = this.getCurrentHand();
        if (!hand || !hand.canSplit()) return false;

        // Cannot split if Aces and already re-split (based on rules)
        if (hand.cards[0].rank === 'A' && !this.rules.resplitAces) {
            return false;
        }

        // Create new hand with second card
        const newHand = new Hand();
        newHand.addCard(hand.cards.pop());
        newHand.bet = hand.bet;
        newHand.isSplitHand = true;

        // Check if splitting Aces
        if (hand.cards[0].rank === 'A') {
            hand.isAceSplit = true;
            newHand.isAceSplit = true;
        }

        // Add one card to each hand
        hand.addCard(this.deck.draw());
        newHand.addCard(this.deck.draw());

        // If split Aces, mark them as needing automatic stand (they get exactly 1 card)
        if (hand.isAceSplit) {
            hand.status = 'splitAce';
            newHand.status = 'splitAce';
        }

        // Add new hand to seat
        this.seats[this.currentSeat].push(newHand);

        // Double the bet for split (add equal amount)
        this.bets[this.currentSeat] *= 2;

        // Move to next hand
        this.nextActiveHand();
        return true;
    }

    playDealer() {
        this.gameState = 'dealerTurn';
        this.currentSeat = null;
        this.currentHandIndex = null;

        // Dealer plays according to rules
        // Hit on 16 or less, stand on 17 or more
        // Exception: Hit on soft 17 (A+6) if rule is enabled
        while (true) {
            const dealerValue = this.dealer.getValue();
            
            if (dealerValue > 21) {
                break; // Bust
            }
            
            if (dealerValue >= 17) {
                // Check soft 17 rule (H17 = Dealer Hits Soft 17)
                const hasSoftHand = this.dealer.cards.some(card => card.rank === 'A');
                if (dealerValue === 17 && hasSoftHand && this.rules.dealerHitsSoft17) {
                    // Soft 17 and H17 is enabled - dealer must hit
                    this.dealer.addCard(this.deck.draw());
                } else {
                    // 17 or higher (or soft 17 with S17 rule) - stand
                    break;
                }
            } else {
                // 16 or less - must hit
                this.dealer.addCard(this.deck.draw());
            }
        }

        this.resolveHands();
    }

    resolveHands() {
        this.gameState = 'results';

        const dealerValue = this.dealer.getValue();
        const dealerBusted = this.dealer.isBusted();

        for (let seat = 0; seat < 5; seat++) {
            if (this.bets[seat] === 0) continue;

            for (let hand of this.seats[seat]) {
                if (hand.status === 'blackjack') {
                    // Blackjack stays as is - will pay 3:2
                    continue;
                }

                // Skip if still in splitAce status (shouldn't happen but safety check)
                if (hand.status === 'splitAce') {
                    hand.status = 'stand';
                }

                if (hand.isBusted()) {
                    hand.status = 'loss';
                } else if (dealerBusted) {
                    hand.status = 'win';
                } else if (hand.getValue() > dealerValue) {
                    hand.status = 'win';
                } else if (hand.getValue() < dealerValue) {
                    hand.status = 'loss';
                } else {
                    hand.status = 'push';
                }
            }
        }
    }

    calculateWinnings(seatIndex) {
        let winnings = 0;
        const hands = this.seats[seatIndex];
        const seatBet = this.bets[seatIndex];

        if (seatBet === 0) return 0;

        // Natural blackjack pays 3:2
        if (hands.length === 1 && hands[0].status === 'blackjack') {
            winnings = seatBet * 1.5; // 3:2 payout
        } else {
            // For regular hands and splits, calculate per hand
            const betPerHand = seatBet / hands.length;
            for (let hand of hands) {
                if (hand.status === 'win') {
                    winnings += betPerHand * 2; // 1:1 payout (double original bet)
                } else if (hand.status === 'push') {
                    winnings += betPerHand; // Return original bet
                }
                // Loss adds nothing
            }
        }

        return winnings;
    }

    reset() {
        this.bets = Array(5).fill(0);
        this.gameState = 'betting';
        this.dealer.clear();
        this.seats.forEach(hands => {
            hands.forEach(hand => hand.clear());
            hands.length = 1;
        });
        this.currentSeat = null;
        this.currentHandIndex = null;
    }
}
