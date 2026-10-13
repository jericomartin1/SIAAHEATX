// script.js - shared functions used by all pages

// Get a list (like "customers") from the browser's storage
function getList(name) {
  var text = localStorage.getItem(name);
  if (text == null) {
    return [];
  }
  return JSON.parse(text);
}

// Save a list to the browser's storage
function saveList(name, list) {
  localStorage.setItem(name, JSON.stringify(list));
}

// Which automatic notifications are turned on
function getRules() {
  var text = localStorage.getItem("rules");
  if (text == null) {
    return { confirm: true, change: true, status: true, remind: true };
  }
  return JSON.parse(text);
}

// Fill a dropdown with the customer names
function fillCustomerSelect(id) {
  var list = getList("customers");
  var html = "";
  for (var i = 0; i < list.length; i++) {
    html += "<option>" + list[i].name + "</option>";
  }
  document.getElementById(id).innerHTML = html;
}

// Fill a dropdown with the technician names
function fillTechSelect(id) {
  var list = getList("technicians");
  var html = "";
  for (var i = 0; i < list.length; i++) {
    html += "<option>" + list[i].name + "</option>";
  }
  document.getElementById(id).innerHTML = html;
}

// Fill a dropdown with bookings (customer - service - date)
function fillBookingSelect(id) {
  var list = getList("bookings");
  var html = "";
  for (var i = 0; i < list.length; i++) {
    html += "<option>" + list[i].customer + " - " + list[i].service + " - " + list[i].date + "</option>";
  }
  document.getElementById(id).innerHTML = html;
}

// Check the booking rules. Returns an error message, or "" if everything is OK.
function checkBooking(record, ignoreId) {
  // Rule 1: the technician must be available
  var techs = getList("technicians");
  for (var i = 0; i < techs.length; i++) {
    if (techs[i].name == record.technician && techs[i].availability != "Available" && record.status != "Completed") {
      return record.technician + " is not available (" + techs[i].availability + ").";
    }
  }
  // Rule 2: the technician cannot have two jobs at the same date and time
  var bookings = getList("bookings");
  for (var j = 0; j < bookings.length; j++) {
    var b = bookings[j];
    if (b.id != ignoreId && record.status != "Completed" && b.technician == record.technician && b.date == record.date && b.time == record.time && b.status != "Completed") {
      return "This technician already has a job at that date and time.";
    }
  }
  // Rule 3: a booking cannot be scheduled while the work permit is pending
  if (record.permit == "Pending" && (record.status == "Scheduled" || record.status == "Ongoing")) {
    return "Work permit is still pending. Keep the status as Pending until it is approved.";
  }
  return "";
}

// Create an SMS and an email notification (simulated - saved in the log)
function sendNotification(booking, eventName) {
  var rules = getRules();
  if (rules[eventName] != true) {
    return;
  }
  // find the customer to get the phone number and email
  var customers = getList("customers");
  var customer = null;
  for (var i = 0; i < customers.length; i++) {
    if (customers[i].name == booking.customer) {
      customer = customers[i];
    }
  }
  if (customer == null) {
    return;
  }
  var text = "Heat-X: ";
  if (eventName == "confirm") {
    text += "booking confirmed for " + booking.service + " on " + booking.date + " at " + booking.time + ".";
  } else if (eventName == "change") {
    text += "schedule changed. " + booking.service + " is now " + booking.date + " at " + booking.time + ".";
  } else if (eventName == "status") {
    text += "your " + booking.service + " service is now " + booking.status + ".";
  } else {
    text += "reminder: " + booking.service + " tomorrow at " + booking.time + ".";
  }
  var log = getList("notifications");
  var time = new Date().toLocaleString();
  log.unshift({ time: time, channel: "SMS", to: customer.phone, message: text });
  log.unshift({ time: time, channel: "Email", to: customer.email, message: text });
  saveList("notifications", log);
  alert("SMS and email sent to " + customer.name + " (simulated).");
}
