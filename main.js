Items = new Mongo.Collection("items");

//TODO Meteor.startup add first user as an admin

/**
 * TODO add "clicked" class for each item
 * IF the user is logged in
 * when clicked, search up this item
 *
 */

/**
 * not necessary, but doable
 * TODO percentage bars = votes.count() for this item / total votes.count() across all items
 */

/**
 * TODO what about moving votes?
 * TODO I don't think facebook even has this, so not necessary for now, but a good feature
 */

/**
 * TODO add embed facebook/etc comment boxes
 */

Meteor.methods({
});

if (Meteor.isServer) {
    Accounts.onCreateUser(function(options, user) {

        var x = Meteor.users.find().count();

        var account_type = "user";
        if (x === 0) {
            account_type = "admin";
        }

        user.type = account_type;

        if (options.profile)
            user.profile = options.profile;
        return user;
    });

    Accounts.config({
        //sendVerificationEmail: true,
        //forbidClientAccountCreation: false
    });

    Meteor.publish("tasks", function () {
        return Items.find({
            $or: [
                {private: {$ne: true}},
                {owner: this.userId}
            ]
        });
    });
    Meteor.methods({
        isAdmin: function (user) {
            if (user === null) {
                return false;
            } else {
                var x = Meteor.users.findOne({_id: user}).type;
                if (x === "admin") {
                    return true;
                } else {
                    return false;
                }
            }
        },
        /*
        isSelected: function (user, item_id) {
            if (user === null) {
                return false;
            } else {
                //if user is in this
                //console.log(item_id);

                var index = Items.findOne({_id: item_id}).votes.indexOf(user);
                if (index != -1) {
                    return true;
                } else {
                    return false;
                }
            }
        },*/
        addItem: function (text, id) {
            if (! Meteor.userId()) {
                throw new Meteor.Error("not-authorized");
            }

            var retrieved_item = Items.findOne({text: text});
            if (retrieved_item === undefined) {
                var item = {
                    text: text,
                    createdAt: new Date(),
                    votes: [],
                    created: Meteor.user().username
                };

                item.votes.push(id);
                Items.insert(item);
            } else {
                if (Items.findOne({_id: retrieved_item._id}).votes.indexOf(id) === -1) {
                    Items.update(
                        { _id: retrieved_item._id },
                        { $push: { votes: id }}
                    );
                } else {
                    Items.update(
                        { _id: retrieved_item._id },
                        { $pull: { votes: id }}
                    );
                }
            }
        },
        deleteItem: function (taskId) {
            var task = Items.findOne(taskId);

            if (! Meteor.userId()) {
                throw new Meteor.Error("not-authorized");
            }
            Items.remove(taskId);
        }
    });
}

if (!Meteor.isClient) {
} else {
    Meteor.subscribe("tasks");

    Template.body.helpers({
        tasks: function () {
            return Items.find({}, {sort: {votes: -1}}); //TODO WHY doesn't this sort properly?
            //return Items.find().order("votes.length").asList();
        },
        admin: function() {

            Meteor.call("isAdmin", Meteor.userId(), function(error, data) {
                if (error) {
                    console.log(error);
                }
                Session.set('admin_status', data);
            });
            return Session.get('admin_status');
        }
    });
    Template.body.events({
        "submit .new-task": function (event) {
            event.preventDefault();

            var text = event.target.text.value;

            Meteor.call("addItem", text, Meteor.userId());

            event.target.text.value = "";
        }
    });

    Template.task.helpers({
        isOwner: function () {
            return this.owner === Meteor.userId();
        },
        admin: function() {
            Meteor.call("isAdmin", Meteor.userId(), function(error, data) {
                if (error) {
                    console.log(error);
                }
                Session.set('admin_status', data);
            });
            return Session.get('admin_status');
        },
        //selected: function() {
            /*
            Meteor.call("isSelected", Meteor.userId(), this._id, function(error, data) {
                if (error) {
                    console.log(error);
                }
                Session.set('selected_status', data);
            });
            return Session.get('selected_status');*/
        //}
    });
    Template.task.events({
        "click .delete": function () {
            Meteor.call("deleteItem", this._id);
        },
        /*"click .item": function() {
            Meteor.call("isSelected", Meteor.userId(), this._id, function(error, data) {
                if (error) {
                    console.log(error);
                }
                Session.set('selected_status', data);
            });
            return Session.get('selected_status');
        }*/
    });

    Accounts.ui.config({
        passwordSignupFields: "USERNAME_ONLY"
    });
}