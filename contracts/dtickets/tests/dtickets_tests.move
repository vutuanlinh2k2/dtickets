#[test_only]
module dtickets::dtickets_tests;

use dtickets::dtickets::{Self, Event, Ticket, ResaleListing};
use std::string;
use sui::clock;
use sui::coin;
use sui::sui::SUI;
use sui::test_scenario::{Self, Scenario};

// Test addresses
const ADMIN: address = @0x0;
const USER1: address = @0x1;
const USER2: address = @0x2;

// Test constants
const TICKET_PRICE: u64 = 1_000_000_000; // 1 SUI in MIST
const TOTAL_SUPPLY: u64 = 100;
const START_TIME: u64 = 1_700_000_000_000; // Future timestamp
const END_TIME: u64 = 1_800_000_000_000; // Later timestamp

#[test]
fun test_create_event_success() {
    let mut scenario = test_scenario::begin(ADMIN);
    let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
    clock::set_for_testing(&mut clock, 1_000_000_000); // Current time

    // Create event
    {
        dtickets::create_event(
            b"Test Concert",
            b"A great music concert",
            b"Music Hall",
            b"https://example.com/image.jpg",
            START_TIME,
            END_TIME,
            TICKET_PRICE,
            TOTAL_SUPPLY,
            &clock,
            test_scenario::ctx(&mut scenario),
        );
    };

    // Check that event was created as shared object
    test_scenario::next_tx(&mut scenario, USER1); // Any user can see shared objects
    {
        assert!(test_scenario::has_most_recent_shared<Event>(), 0);

        let event = test_scenario::take_shared<Event>(&scenario);
        let (
            name,
            description,
            venue,
            start_time,
            end_time,
            organizer,
            ticket_price,
            total_tickets,
            tickets_sold,
        ) = dtickets::get_event_info(&event);

        assert!(name == string::utf8(b"Test Concert"), 1);
        assert!(description == string::utf8(b"A great music concert"), 2);
        assert!(venue == string::utf8(b"Music Hall"), 3);
        assert!(start_time == START_TIME, 4);
        assert!(end_time == END_TIME, 5);
        assert!(organizer == ADMIN, 6);
        assert!(ticket_price == TICKET_PRICE, 7);
        assert!(total_tickets == TOTAL_SUPPLY, 8);
        assert!(tickets_sold == 0, 9);

        test_scenario::return_shared(event);
    };

    clock::destroy_for_testing(clock);
    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = dtickets::EInvalidEventDate)]
fun test_create_event_invalid_date() {
    let mut scenario = test_scenario::begin(ADMIN);
    let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
    clock::set_for_testing(&mut clock, 2_000_000_000_000); // Future time

    // Try to create event with past date
    {
        dtickets::create_event(
            b"Test Concert",
            b"A great music concert",
            b"Music Hall",
            b"https://example.com/image.jpg",
            1_000_000_000_000, // Past date
            1_500_000_000_000, // Still past date
            TICKET_PRICE,
            TOTAL_SUPPLY,
            &clock,
            test_scenario::ctx(&mut scenario),
        );
    };

    clock::destroy_for_testing(clock);
    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = dtickets::EInvalidTicketPrice)]
fun test_create_event_invalid_price() {
    let mut scenario = test_scenario::begin(ADMIN);
    let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
    clock::set_for_testing(&mut clock, 1_000_000_000);

    // Try to create event with zero price
    {
        dtickets::create_event(
            b"Test Concert",
            b"A great music concert",
            b"Music Hall",
            b"https://example.com/image.jpg",
            START_TIME,
            END_TIME,
            0, // Invalid price
            TOTAL_SUPPLY,
            &clock,
            test_scenario::ctx(&mut scenario),
        );
    };

    clock::destroy_for_testing(clock);
    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = dtickets::EInvalidSupply)]
fun test_create_event_invalid_supply() {
    let mut scenario = test_scenario::begin(ADMIN);
    let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
    clock::set_for_testing(&mut clock, 1_000_000_000);

    // Try to create event with zero tickets
    {
        dtickets::create_event(
            b"Test Concert",
            b"A great music concert",
            b"Music Hall",
            b"https://example.com/image.jpg",
            START_TIME,
            END_TIME,
            TICKET_PRICE,
            0, // Invalid supply
            &clock,
            test_scenario::ctx(&mut scenario),
        );
    };

    clock::destroy_for_testing(clock);
    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = dtickets::EInvalidTimeRange)]
fun test_create_event_invalid_time_range() {
    let mut scenario = test_scenario::begin(ADMIN);
    let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
    clock::set_for_testing(&mut clock, 1_000_000_000);

    // Try to create event with end_time <= start_time
    {
        dtickets::create_event(
            b"Test Concert",
            b"A great music concert",
            b"Music Hall",
            b"https://example.com/image.jpg",
            START_TIME,
            START_TIME - 1000, // End time before start time
            TICKET_PRICE,
            TOTAL_SUPPLY,
            &clock,
            test_scenario::ctx(&mut scenario),
        );
    };

    clock::destroy_for_testing(clock);
    test_scenario::end(scenario);
}

#[test]
fun test_purchase_ticket_success() {
    let mut scenario = test_scenario::begin(ADMIN);

    // Initialize and create event
    setup_event(&mut scenario);

    // User purchases ticket
    test_scenario::next_tx(&mut scenario, USER1);
    {
        let mut event = test_scenario::take_shared<Event>(&scenario);
        let payment = coin::mint_for_testing<SUI>(TICKET_PRICE, test_scenario::ctx(&mut scenario));

        dtickets::purchase_ticket(
            &mut event,
            payment,
            USER1, // recipient
            test_scenario::ctx(&mut scenario),
        );

        // Check event state updated
        let tickets_sold = dtickets::get_event_tickets_sold(&event);
        assert!(tickets_sold == 1, 0);

        test_scenario::return_shared(event);
    };

    // Check ticket was created and transferred to user
    test_scenario::next_tx(&mut scenario, USER1);
    {
        assert!(test_scenario::has_most_recent_for_sender<Ticket>(&scenario), 1);

        let ticket = test_scenario::take_from_sender<Ticket>(&scenario);
        let ticket_number = dtickets::get_ticket_number(&ticket);

        assert!(ticket_number == 1, 2);

        test_scenario::return_to_sender(&scenario, ticket);
    };

    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = dtickets::EInsufficientPayment)]
fun test_purchase_ticket_insufficient_payment() {
    let mut scenario = test_scenario::begin(ADMIN);

    // Initialize and create event
    setup_event(&mut scenario);

    // User tries to purchase ticket with insufficient payment
    test_scenario::next_tx(&mut scenario, USER1);
    {
        let mut event = test_scenario::take_shared<Event>(&scenario);
        let payment = coin::mint_for_testing<SUI>(
            TICKET_PRICE - 1,
            test_scenario::ctx(&mut scenario),
        );

        dtickets::purchase_ticket(
            &mut event,
            payment,
            USER1,
            test_scenario::ctx(&mut scenario),
        );

        test_scenario::return_shared(event);
    };

    test_scenario::end(scenario);
}

#[test]
fun test_purchase_ticket_overpayment() {
    let mut scenario = test_scenario::begin(ADMIN);

    // Initialize and create event
    setup_event(&mut scenario);

    // User purchases ticket with overpayment
    test_scenario::next_tx(&mut scenario, USER1);
    {
        let mut event = test_scenario::take_shared<Event>(&scenario);
        let payment = coin::mint_for_testing<SUI>(
            TICKET_PRICE + 500_000_000, // Overpayment (0.5 SUI extra)
            test_scenario::ctx(&mut scenario),
        );

        dtickets::purchase_ticket(
            &mut event,
            payment,
            USER1,
            test_scenario::ctx(&mut scenario),
        );

        // Check event state updated
        let tickets_sold = dtickets::get_event_tickets_sold(&event);
        assert!(tickets_sold == 1, 0);

        test_scenario::return_shared(event);
    };

    test_scenario::end(scenario);
}

#[test]
fun test_purchase_ticket_to_different_recipient() {
    let mut scenario = test_scenario::begin(ADMIN);

    // Initialize and create event
    setup_event(&mut scenario);

    // User1 purchases ticket for User2
    test_scenario::next_tx(&mut scenario, USER1);
    {
        let mut event = test_scenario::take_shared<Event>(&scenario);
        let payment = coin::mint_for_testing<SUI>(TICKET_PRICE, test_scenario::ctx(&mut scenario));

        dtickets::purchase_ticket(
            &mut event,
            payment,
            USER2, // recipient is different from buyer
            test_scenario::ctx(&mut scenario),
        );

        test_scenario::return_shared(event);
    };

    // Check ticket was transferred to User2 (recipient)
    test_scenario::next_tx(&mut scenario, USER2);
    {
        assert!(test_scenario::has_most_recent_for_sender<Ticket>(&scenario), 0);

        let ticket = test_scenario::take_from_sender<Ticket>(&scenario);
        let ticket_number = dtickets::get_ticket_number(&ticket);

        assert!(ticket_number == 1, 1);

        test_scenario::return_to_sender(&scenario, ticket);
    };

    test_scenario::end(scenario);
}

#[test]
fun test_multiple_ticket_purchases() {
    let mut scenario = test_scenario::begin(ADMIN);

    // Initialize and create event
    setup_event(&mut scenario);

    // User1 purchases ticket
    test_scenario::next_tx(&mut scenario, USER1);
    {
        let mut event = test_scenario::take_shared<Event>(&scenario);
        let payment = coin::mint_for_testing<SUI>(TICKET_PRICE, test_scenario::ctx(&mut scenario));

        dtickets::purchase_ticket(&mut event, payment, USER1, test_scenario::ctx(&mut scenario));

        // Check event state
        let tickets_sold = dtickets::get_event_tickets_sold(&event);
        assert!(tickets_sold == 1, 0);

        test_scenario::return_shared(event);
    };

    // User2 purchases ticket
    test_scenario::next_tx(&mut scenario, USER2);
    {
        let mut event = test_scenario::take_shared<Event>(&scenario);
        let payment = coin::mint_for_testing<SUI>(TICKET_PRICE, test_scenario::ctx(&mut scenario));

        dtickets::purchase_ticket(&mut event, payment, USER2, test_scenario::ctx(&mut scenario));

        // Check event state
        let tickets_sold = dtickets::get_event_tickets_sold(&event);
        assert!(tickets_sold == 2, 1);

        test_scenario::return_shared(event);
    };

    // Check both users have their tickets
    test_scenario::next_tx(&mut scenario, USER1);
    {
        let ticket = test_scenario::take_from_sender<Ticket>(&scenario);
        let ticket_number = dtickets::get_ticket_number(&ticket);
        assert!(ticket_number == 1, 2);
        test_scenario::return_to_sender(&scenario, ticket);
    };

    test_scenario::next_tx(&mut scenario, USER2);
    {
        let ticket = test_scenario::take_from_sender<Ticket>(&scenario);
        let ticket_number = dtickets::get_ticket_number(&ticket);
        assert!(ticket_number == 2, 3);
        test_scenario::return_to_sender(&scenario, ticket);
    };

    test_scenario::end(scenario);
}

#[test]
fun test_view_functions() {
    let mut scenario = test_scenario::begin(ADMIN);

    // Setup event
    setup_event(&mut scenario);

    test_scenario::next_tx(&mut scenario, USER1);
    {
        let event = test_scenario::take_shared<Event>(&scenario);

        // Test individual getter functions
        assert!(dtickets::get_event_name(&event) == string::utf8(b"Test Concert"), 0);
        assert!(
            dtickets::get_event_description(&event) == string::utf8(b"A great music concert"),
            1,
        );
        assert!(dtickets::get_event_venue(&event) == string::utf8(b"Music Hall"), 2);
        assert!(dtickets::get_event_start_time(&event) == START_TIME, 3);
        assert!(dtickets::get_event_end_time(&event) == END_TIME, 4);
        assert!(dtickets::get_event_organizer(&event) == ADMIN, 5);
        assert!(dtickets::get_event_ticket_price(&event) == TICKET_PRICE, 6);
        assert!(dtickets::get_event_total_tickets(&event) == TOTAL_SUPPLY, 7);
        assert!(dtickets::get_event_tickets_sold(&event) == 0, 8);

        // Test has_available_tickets
        assert!(dtickets::has_available_tickets(&event) == true, 9);

        // Test get_available_tickets
        assert!(dtickets::get_available_tickets(&event) == TOTAL_SUPPLY, 10);

        test_scenario::return_shared(event);
    };

    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = dtickets::EEventSoldOut)]
fun test_sold_out_event() {
    let mut scenario = test_scenario::begin(ADMIN);

    // Create event with only 1 ticket
    {
        let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 1_000_000_000);

        dtickets::create_event(
            b"Small Event",
            b"Only one ticket",
            b"Small Venue",
            b"https://example.com/image.jpg",
            START_TIME,
            END_TIME,
            TICKET_PRICE,
            1, // Only 1 ticket
            &clock,
            test_scenario::ctx(&mut scenario),
        );

        clock::destroy_for_testing(clock);
    };

    // First user buys the only ticket
    test_scenario::next_tx(&mut scenario, USER1);
    {
        let mut event = test_scenario::take_shared<Event>(&scenario);
        let payment = coin::mint_for_testing<SUI>(TICKET_PRICE, test_scenario::ctx(&mut scenario));

        dtickets::purchase_ticket(
            &mut event,
            payment,
            USER1,
            test_scenario::ctx(&mut scenario),
        );

        test_scenario::return_shared(event);
    };

    // Second user tries to buy ticket (should fail - sold out)
    test_scenario::next_tx(&mut scenario, USER2);
    {
        let mut event = test_scenario::take_shared<Event>(&scenario);
        let payment = coin::mint_for_testing<SUI>(TICKET_PRICE, test_scenario::ctx(&mut scenario));

        // This should abort with EEventSoldOut (code 2)
        dtickets::purchase_ticket(
            &mut event,
            payment,
            USER2,
            test_scenario::ctx(&mut scenario),
        );

        test_scenario::return_shared(event);
    };

    test_scenario::end(scenario);
}

#[test]
fun test_event_creation_by_different_users() {
    let mut scenario = test_scenario::begin(USER1);

    // User1 creates an event
    {
        let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 1_000_000_000);

        dtickets::create_event(
            b"User1 Event",
            b"Event created by User1",
            b"User1 Venue",
            b"https://example.com/user1.jpg",
            START_TIME,
            END_TIME,
            TICKET_PRICE,
            50,
            &clock,
            test_scenario::ctx(&mut scenario),
        );

        clock::destroy_for_testing(clock);
    };

    // Check that User1 is the organizer
    test_scenario::next_tx(&mut scenario, USER2);
    {
        let event = test_scenario::take_shared<Event>(&scenario);
        assert!(dtickets::get_event_organizer(&event) == USER1, 0);
        test_scenario::return_shared(event);
    };

    test_scenario::end(scenario);
}

#[test]
fun test_available_tickets_calculation() {
    let mut scenario = test_scenario::begin(ADMIN);

    // Create event with 3 tickets
    {
        let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 1_000_000_000);

        dtickets::create_event(
            b"Small Event",
            b"Only three tickets",
            b"Small Venue",
            b"https://example.com/image.jpg",
            START_TIME,
            END_TIME,
            TICKET_PRICE,
            3,
            &clock,
            test_scenario::ctx(&mut scenario),
        );

        clock::destroy_for_testing(clock);
    };

    // Initially 3 tickets available
    test_scenario::next_tx(&mut scenario, USER1);
    {
        let event = test_scenario::take_shared<Event>(&scenario);
        assert!(dtickets::get_available_tickets(&event) == 3, 0);
        assert!(dtickets::has_available_tickets(&event) == true, 1);
        test_scenario::return_shared(event);
    };

    // Purchase 1 ticket
    test_scenario::next_tx(&mut scenario, USER1);
    {
        let mut event = test_scenario::take_shared<Event>(&scenario);
        let payment = coin::mint_for_testing<SUI>(TICKET_PRICE, test_scenario::ctx(&mut scenario));

        dtickets::purchase_ticket(&mut event, payment, USER1, test_scenario::ctx(&mut scenario));

        // Now 2 tickets available
        assert!(dtickets::get_available_tickets(&event) == 2, 2);
        assert!(dtickets::has_available_tickets(&event) == true, 3);

        test_scenario::return_shared(event);
    };

    // Purchase 2 more tickets
    test_scenario::next_tx(&mut scenario, USER2);
    {
        let mut event = test_scenario::take_shared<Event>(&scenario);
        let payment1 = coin::mint_for_testing<SUI>(TICKET_PRICE, test_scenario::ctx(&mut scenario));
        let payment2 = coin::mint_for_testing<SUI>(TICKET_PRICE, test_scenario::ctx(&mut scenario));

        dtickets::purchase_ticket(&mut event, payment1, USER2, test_scenario::ctx(&mut scenario));
        dtickets::purchase_ticket(&mut event, payment2, USER2, test_scenario::ctx(&mut scenario));

        // Now 0 tickets available (sold out)
        assert!(dtickets::get_available_tickets(&event) == 0, 4);
        assert!(dtickets::has_available_tickets(&event) == false, 5);

        test_scenario::return_shared(event);
    };

    test_scenario::end(scenario);
}

// Helper functions

fun setup_event(scenario: &mut Scenario) {
    let mut clock = clock::create_for_testing(test_scenario::ctx(scenario));
    clock::set_for_testing(&mut clock, 1_000_000_000);

    dtickets::create_event(
        b"Test Concert",
        b"A great music concert",
        b"Music Hall",
        b"https://example.com/image.jpg",
        START_TIME,
        END_TIME,
        TICKET_PRICE,
        TOTAL_SUPPLY,
        &clock,
        test_scenario::ctx(scenario),
    );

    clock::destroy_for_testing(clock);
}

#[test]
fun test_ticket_resale_flow() {
    let alice = @0xA; // Initial ticket buyer, then seller
    let bob = @0xB; // Purchaser of the resold ticket
    let eve = @0xE; // Another user for cancellation test

    let mut scenario = test_scenario::begin(ADMIN);

    // 1. Admin creates an event
    setup_event(&mut scenario);

    // 2. Alice purchases a ticket
    test_scenario::next_tx(&mut scenario, alice);
    let ticket_to_resell_id: ID;
    let resale_price = 1_200_000_000; // 1.2 SUI (higher than original)
    {
        let mut event = test_scenario::take_shared<Event>(&scenario);
        let payment = coin::mint_for_testing<SUI>(TICKET_PRICE, test_scenario::ctx(&mut scenario));
        // Alice buys for herself initially
        dtickets::purchase_ticket(&mut event, payment, alice, test_scenario::ctx(&mut scenario));
        assert!(dtickets::get_event_tickets_sold(&event) == 1, 0);

        test_scenario::return_shared(event);
    };

    // Alice retrieves her ticket (Ticket object)
    test_scenario::next_tx(&mut scenario, alice);
    {
        assert!(test_scenario::has_most_recent_for_sender<Ticket>(&scenario), 1);
        let alice_ticket_object = test_scenario::take_from_sender<Ticket>(&scenario);
        ticket_to_resell_id = dtickets::get_ticket_id(&alice_ticket_object);

        // 3. Alice lists the ticket for resale in the same transaction
        dtickets::list_ticket_for_resale(
            alice_ticket_object,
            resale_price,
            test_scenario::ctx(&mut scenario),
        );
    };

    // 4. Verify ResaleListing details
    test_scenario::next_tx(&mut scenario, bob); // Use any address to view shared object
    {
        let listing = test_scenario::take_shared<ResaleListing>(&scenario);
        assert!(dtickets::get_resale_listing_seller(&listing) == alice, 1);
        assert!(dtickets::get_resale_listing_price(&listing) == resale_price, 2);
        assert!(dtickets::get_resale_listing_ticket_id(&listing) == ticket_to_resell_id, 3);
        // Put it back for Bob to purchase
        test_scenario::return_shared(listing);
    };

    // 5. Bob purchases the resold ticket
    test_scenario::next_tx(&mut scenario, bob);
    {
        let listing = test_scenario::take_shared<ResaleListing>(&scenario);
        let payment = coin::mint_for_testing<SUI>(resale_price, test_scenario::ctx(&mut scenario));
        // Bob buys for himself
        dtickets::purchase_resold_ticket(listing, payment, bob, test_scenario::ctx(&mut scenario));
        // Listing object is deleted by purchase_resold_ticket
    };

    // 6. Verify Bob owns the ticket
    // Bob needs to take the ticket he received.
    test_scenario::next_tx(&mut scenario, bob);
    {
        let bobs_ticket = test_scenario::take_from_sender<Ticket>(&scenario);
        assert!(dtickets::get_ticket_id(&bobs_ticket) == ticket_to_resell_id, 4);
        test_scenario::return_to_sender(&scenario, bobs_ticket);
    };

    // --- Test Resale Cancellation ---
    // Eve purchases a ticket first to list it
    test_scenario::next_tx(&mut scenario, eve);
    {
        let mut event = test_scenario::take_shared<Event>(&scenario);
        let payment = coin::mint_for_testing<SUI>(TICKET_PRICE, test_scenario::ctx(&mut scenario));
        dtickets::purchase_ticket(&mut event, payment, eve, test_scenario::ctx(&mut scenario));
        assert!(dtickets::get_event_tickets_sold(&event) == 2, 5); // Alice's original, now Eve's
        test_scenario::return_shared(event);
    };

    // Eve lists her ticket for resale
    let eve_resale_price = 900_000_000; // 0.9 SUI
    test_scenario::next_tx(&mut scenario, eve);
    let eves_ticket_object_id = {
        let eves_ticket_to_list = test_scenario::take_from_sender<Ticket>(&scenario);
        let eves_ticket_object_id = dtickets::get_ticket_id(&eves_ticket_to_list);
        dtickets::list_ticket_for_resale(
            eves_ticket_to_list,
            eve_resale_price,
            test_scenario::ctx(&mut scenario),
        );

        eves_ticket_object_id
    };

    // Eve cancels the resale listing
    test_scenario::next_tx(&mut scenario, eve);
    {
        let listing_to_cancel = test_scenario::take_shared<ResaleListing>(&scenario); // Eve takes back her listing obj
        assert!(dtickets::get_resale_listing_seller(&listing_to_cancel) == eve, 6);
        assert!(
            dtickets::get_resale_listing_ticket_id(&listing_to_cancel) == eves_ticket_object_id,
            7,
        );
        dtickets::cancel_resale_listing(listing_to_cancel, test_scenario::ctx(&mut scenario));
        // Listing object is deleted by cancel_resale_listing
    };

    // Verify Eve has her ticket back
    test_scenario::next_tx(&mut scenario, eve);
    {
        let eves_retrieved_ticket = test_scenario::take_from_sender<Ticket>(&scenario);
        assert!(dtickets::get_ticket_id(&eves_retrieved_ticket) == eves_ticket_object_id, 8);
        test_scenario::return_to_sender(&scenario, eves_retrieved_ticket);
    };

    test_scenario::end(scenario);
}
