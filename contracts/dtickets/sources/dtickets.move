/// A decentralized ticketing system on Sui blockchain
module dtickets::dtickets;

use std::string::{Self, String};
use sui::clock::{Self, Clock};
use sui::coin::{Self, Coin};
use sui::event;
use sui::sui::SUI;

// === Errors ===

const EInsufficientPayment: u64 = 1;
const EEventSoldOut: u64 = 2;
const EInvalidTicketPrice: u64 = 3;
const EInvalidEventDate: u64 = 4;
const EInvalidSupply: u64 = 5;
const EInvalidTimeRange: u64 = 6;
const EInvalidResalePrice: u64 = 7;
const EInsufficientResalePayment: u64 = 8;
const ENotListingSeller: u64 = 9;

// === Structs ===

/// Represents an event that can have tickets sold for it
public struct Event has key {
    id: UID,
    name: String, // metadata
    description: String, // metadata
    venue: String, // metadata
    organizer: address, // metadata
    imgUrl: String, // metadata
    start_time: u64, // timestamp in milliseconds
    end_time: u64, // timestamp in milliseconds
    ticket_price: u64, // price in MIST (1 SUI = 1_000_000_000 MIST)
    total_tickets: u64,
    tickets_sold: u64,
}

/// Represents an individual ticket NFT
public struct Ticket has key, store {
    id: UID,
    event_id: ID, // References the event this ticket is for
    ticket_number: u64,
}

/// Represents a ticket listed for resale
public struct ResaleListing has key {
    id: UID,
    ticket: Ticket, // The actual ticket object
    seller: address,
    resale_price: u64, // Price in MIST
}

// === Events ===

public struct EventCreated has copy, drop {
    event_id: ID,
    name: String,
    start_time: u64,
    end_time: u64,
    venue: String,
    organizer: address,
    ticket_price: u64,
    total_tickets: u64,
    imgUrl: String,
}

public struct TicketPurchased has copy, drop {
    ticket_id: ID,
    event_id: ID,
    buyer: address,
    recipient: address,
    price: u64,
    ticket_number: u64,
}

public struct TicketListedForResale has copy, drop {
    listing_id: ID,
    ticket_id: ID, // ID of the ticket object inside ResaleListing.ticket.id
    original_event_id: ID, // ID of the event the ticket is for
    seller: address,
    resale_price: u64,
}

public struct TicketResaleCancelled has copy, drop {
    listing_id: ID,
    ticket_id: ID,
    seller: address,
}

public struct TicketResold has copy, drop {
    listing_id: ID,
    ticket_id: ID,
    original_event_id: ID,
    seller: address,
    buyer: address,
    resale_price: u64,
}

// === Public Functions ===

/// Create a new event (anyone can organize events)
public fun create_event(
    name: vector<u8>,
    description: vector<u8>,
    venue: vector<u8>,
    imgUrl: vector<u8>,
    start_time: u64,
    end_time: u64,
    ticket_price: u64,
    total_tickets: u64,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    // Validate inputs
    assert!(ticket_price > 0, EInvalidTicketPrice);
    assert!(total_tickets > 0, EInvalidSupply);
    assert!(start_time > clock::timestamp_ms(clock), EInvalidEventDate);
    assert!(end_time > start_time, EInvalidTimeRange);

    let id = object::new(ctx);
    let event_id = object::uid_to_inner(&id);

    let event = Event {
        id,
        name: string::utf8(name),
        description: string::utf8(description),
        venue: string::utf8(venue),
        imgUrl: string::utf8(imgUrl),
        start_time,
        end_time,
        organizer: tx_context::sender(ctx),
        ticket_price,
        total_tickets,
        tickets_sold: 0,
    };

    // Emit event creation event
    event::emit(EventCreated {
        event_id,
        name: event.name,
        organizer: event.organizer,
        ticket_price,
        total_tickets,
        start_time,
        end_time,
        venue: event.venue,
        imgUrl: event.imgUrl,
    });

    transfer::share_object(event);
}

/// Purchase a ticket for an event
public fun purchase_ticket(
    event: &mut Event,
    payment: Coin<SUI>,
    recipient: address,
    ctx: &mut TxContext,
) {
    // Check if event is active and not sold out
    assert!(event.tickets_sold < event.total_tickets, EEventSoldOut);

    // Verify payment amount
    let payment_amount = coin::value(&payment);
    assert!(payment_amount >= event.ticket_price, EInsufficientPayment);

    // Update event state
    event.tickets_sold = event.tickets_sold + 1;
    let ticket_number = event.tickets_sold;

    // Create ticket NFT
    let ticket_id = object::new(ctx);
    let ticket_id_inner = object::uid_to_inner(&ticket_id);
    let event_id = object::uid_to_inner(&event.id);

    let ticket = Ticket {
        id: ticket_id,
        event_id,
        ticket_number,
    };

    // Emit ticket purchase event
    event::emit(TicketPurchased {
        ticket_id: ticket_id_inner,
        event_id,
        buyer: tx_context::sender(ctx),
        recipient,
        price: event.ticket_price,
        ticket_number,
    });

    // Transfer payment to organizer
    transfer::public_transfer(payment, event.organizer);

    // Transfer ticket to buyer
    transfer::transfer(ticket, recipient);
}

/// List a ticket for resale
public fun list_ticket_for_resale(ticket: Ticket, resale_price: u64, ctx: &mut TxContext) {
    assert!(resale_price > 0, EInvalidResalePrice);

    let seller = tx_context::sender(ctx);
    let listing_id_obj = object::new(ctx);
    let listing_id = object::uid_to_inner(&listing_id_obj);
    let ticket_id = object::uid_to_inner(&ticket.id);
    let original_event_id = ticket.event_id;

    let listing = ResaleListing {
        id: listing_id_obj,
        ticket,
        seller,
        resale_price,
    };

    event::emit(TicketListedForResale {
        listing_id,
        ticket_id,
        original_event_id,
        seller,
        resale_price,
    });

    transfer::share_object(listing);
}

/// Cancel a resale listing
public fun cancel_resale_listing(listing: ResaleListing, ctx: &mut TxContext) {
    assert!(tx_context::sender(ctx) == listing.seller, ENotListingSeller);

    let ResaleListing { id, ticket, seller, resale_price: _ } = listing;
    let listing_id = object::uid_to_inner(&id);
    let ticket_id = object::uid_to_inner(&ticket.id);

    event::emit(TicketResaleCancelled {
        listing_id,
        ticket_id,
        seller,
    });

    transfer::transfer(ticket, seller); // Return ticket to seller
    object::delete(id); // Delete the listing object
}

/// Purchase a resold ticket
public fun purchase_resold_ticket(
    listing: ResaleListing,
    payment: Coin<SUI>,
    recipient: address,
    ctx: &mut TxContext,
) {
    let payment_amount = coin::value(&payment);
    assert!(payment_amount >= listing.resale_price, EInsufficientResalePayment);

    let ResaleListing { id, ticket, seller, resale_price } = listing;
    let listing_id = object::uid_to_inner(&id);
    let ticket_id = object::uid_to_inner(&ticket.id);
    let original_event_id = ticket.event_id;

    event::emit(TicketResold {
        listing_id,
        ticket_id,
        original_event_id,
        seller,
        buyer: tx_context::sender(ctx),
        resale_price,
    });

    transfer::public_transfer(payment, seller); // Send payment to the original ticket lister
    transfer::transfer(ticket, recipient); // Send ticket to the new buyer
    object::delete(id); // Delete the listing object
}

// === View Functions ===

/// Get event details
public fun get_event_info(
    event: &Event,
): (String, String, String, u64, u64, address, u64, u64, u64) {
    (
        event.name,
        event.description,
        event.venue,
        event.start_time,
        event.end_time,
        event.organizer,
        event.ticket_price,
        event.total_tickets,
        event.tickets_sold,
    )
}

public fun get_event_name(event: &Event): String {
    event.name
}

public fun get_event_description(event: &Event): String {
    event.description
}

public fun get_event_venue(event: &Event): String {
    event.venue
}

public fun get_event_organizer(event: &Event): address {
    event.organizer
}

public fun get_event_start_time(event: &Event): u64 {
    event.start_time
}

public fun get_event_end_time(event: &Event): u64 {
    event.end_time
}

public fun get_event_ticket_price(event: &Event): u64 {
    event.ticket_price
}

public fun get_event_total_tickets(event: &Event): u64 {
    event.total_tickets
}

public fun get_event_tickets_sold(event: &Event): u64 {
    event.tickets_sold
}

/// Get ticket details
public fun get_ticket_info(ticket: &Ticket): (ID, u64) {
    (ticket.event_id, ticket.ticket_number)
}

/// Get the ticket's own ID
public fun get_ticket_id(ticket: &Ticket): ID {
    object::uid_to_inner(&ticket.id)
}

public fun get_ticket_event_id(ticket: &Ticket): ID {
    ticket.event_id
}

public fun get_ticket_number(ticket: &Ticket): u64 {
    ticket.ticket_number
}

/// Check if event has available tickets
public fun has_available_tickets(event: &Event): bool {
    event.tickets_sold < event.total_tickets
}

/// Get available ticket count
public fun get_available_tickets(event: &Event): u64 {
    if (event.tickets_sold >= event.total_tickets) {
        0
    } else {
        event.total_tickets - event.tickets_sold
    }
}

// === View functions for ResaleListing ===

/// Get all details of a resale listing
public fun get_resale_listing_info(listing: &ResaleListing): (ID, ID, address, u64) {
    (
        object::uid_to_inner(&listing.ticket.id),
        listing.ticket.event_id,
        listing.seller,
        listing.resale_price,
    )
}

/// Get the ticket ID from a resale listing
public fun get_resale_listing_ticket_id(listing: &ResaleListing): ID {
    object::uid_to_inner(&listing.ticket.id)
}

/// Get the original event ID from a resale listing
public fun get_resale_listing_original_event_id(listing: &ResaleListing): ID {
    listing.ticket.event_id
}

/// Get the seller's address from a resale listing
public fun get_resale_listing_seller(listing: &ResaleListing): address {
    listing.seller
}

/// Get the resale price from a resale listing
public fun get_resale_listing_price(listing: &ResaleListing): u64 {
    listing.resale_price
}

// === Test Functions ===

#[test_only]
use sui::test_scenario;

#[test_only]
/// Test event creation and ticket purchase flow
public fun test_create_event_and_purchase_ticket() {
    let admin = @0x0;
    let alice = @0xA;
    let bob = @0xB;

    let mut scenario = test_scenario::begin(admin);
    let clock = clock::create_for_testing(scenario.ctx());

    // Create event
    {
        create_event(
            b"Test Concert",
            b"A great concert",
            b"Madison Square Garden",
            b"https://example.com/image.jpg",
            1000000000, // Future start timestamp
            1500000000, // Future end timestamp
            1_000_000_000, // 1 SUI
            100, // 100 tickets
            &clock,
            scenario.ctx(),
        );
    };

    // Purchase ticket
    scenario.next_tx(alice);
    {
        let mut event = scenario.take_shared<Event>();
        let payment = coin::mint_for_testing<SUI>(1_000_000_000, scenario.ctx());

        purchase_ticket(&mut event, payment, bob, scenario.ctx());

        assert!(event.tickets_sold == 1, 0);
        test_scenario::return_shared(event);
    };

    clock::destroy_for_testing(clock);
    scenario.end();
}
