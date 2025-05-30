#[test_only]
module dtickets::dtickets_tests;

use dtickets::dtickets::{Self, Event, Ticket};
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
