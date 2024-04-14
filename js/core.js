$(document).ready(function () {
    // Declare variables
    let peer;
    let conn;
    let connections = {};
    let callConnections = {};
    let connectionTimes = {};
    let localStream;

    // //<- If you want small Secret id
    // // Function to generate a random number
    // function getRandomNumber() {
    //     const randomNumber = Math.floor(Math.random() * 1000) + 500;
    //     return randomNumber;
    // }

    // // Initialize a Peer object with a random ID
    // peer = new Peer(getRandomNumber());

    // // ->
    // Else get random from peer js
    peer = new Peer();


    // Event handler when Peer connection is open
    peer.on('open', function (id) {
        console.log('Your Secret ID is: ' + id);
        $.notify('Welcome Fellow Human!', "success");
        sessionStorage.setItem('peerID', id);
        $("#mySecretCode").text(id);
    });

    // Function to initiate connection using a provided ID
    function connectRoomId() {
        var targetPeerId = $("#secretInput").val();
        if (!targetPeerId) {
            $.notify("Please enter a peer ID to connect.", "warn");
            return;
        }
        else if (peer.id == targetPeerId) {
            $.notify("You need to Enter secret code for partner you wish to connect.", "info");
            return;
        }
        else {
            $.notify("Requesting connection...", "info");
        }

        conn = peer.connect(targetPeerId);

        // Event handler when connection is open
        conn.on('open', function () {
            console.log('Connected to peer: ', targetPeerId);
            $.notify('Connected to Peer! ' + conn.peer, "success");
            connections[targetPeerId] = Object.keys(connections).length + 1;
            handleNewUserConnected(conn.peer);
            populateRecipientSelect();
        });

        // Event handler for connection error
        conn.on('error', function (err) {
            console.error('Connection error:', err);
            $.notify("Connection failed: " + err.message, "error");
        });

        // Event handler for receiving data from the connected peer
        conn.on('data', function (data) {
            playNotificationSound();
            var $message = $('<div class="message receiver animate__animated animate__lightSpeedInLeft"><span class="badge rounded-pill pill2">' + connections[conn.peer] + '</span>\n' + data + '</div>');
            $(".chat-messages").append($message);
        });
    }

    // Function to send a message
    function sendMessage() {
        var message = $(".message-input input").val();
        var recipientId = $("#recipientSelect").val();
        if (message.length == 0) {
            $.notify('No message!', "warning");
            return;
        }

        $(".message-input input").val("");

        $(".chat-messages").append('<div class="message sender text-end  animate__animated animate__lightSpeedInRight">' + message + ' <span class="badge rounded-pill pill1">You</span></div>');

        peer.connections[recipientId][0].send(message);
    }

    // Event handler for incoming connections
    peer.on('connection', function (incomingConn) {
        conn = incomingConn;
        console.log('Received connection from:', conn.peer);
        $.notify('Incoming Connection!', "info");

        conn.on('open', function () {
            connections[conn.peer] = Object.keys(connections).length + 1;
            console.log('Connection opened with:', conn.peer);
            handleNewUserConnected(conn.peer);
            populateRecipientSelect();
        });

        conn.on('data', function (data) {
            playNotificationSound()
            var $message = $('<div class="message receiver animate__animated animate__lightSpeedInLeft"><span class="badge rounded-pill pill2">' + connections[conn.peer] + '</span>\n' + data + '</div>');
            $(".chat-messages").append($message);
        });
    });

    // Event handler for incoming calls
    peer.on('call', function (call) {
        if (confirm('⚓️ Ahoy! Incoming Call! Will Ye Answer? 📞' + call.peer)) {
            getUserMediaStream()
                .then(stream => {
                    localStream = stream;
                    const videoElement = document.getElementById('local-video');
                    videoElement.srcObject = stream;
                    videoElement.muted = true;
                    videoElement.play();
                    $('#local-video').addClass('visible');
                    call.answer(localStream);

                    callConnections[call.peer] = call;
                    call.on('stream', function (remoteStream) {
                        const videoElement = document.getElementById('user_' + call.peer + '_video_ele');
                        videoElement.style.display = "block";
                        const imgPlaceholder = $('#user_' + call.peer + '_img_placeholder');
                        imgPlaceholder.hide();
                        videoElement.srcObject = remoteStream;
                        videoElement.play();
                        const btnImgSrc = videoElement.muted ? "./images/mute.svg" : "./images/unMute.svg";
                        $('#user_' + call.peer + '_mute_btn img').attr('src', btnImgSrc);
                    });

                    call.on('close', function () {
                        console.log('CALL Disconnected from Peer Server! ' + call.peer);
                        $.notify('CALL Disconnected from Peer Server! ' + call.peer, "warn");
                        call.close();
                    });

                })
                .catch(err => {
                    console.error('Error getting user media:', err);
                    $.notify('Failed to access camera and microphone!', "error");
                });
        } else {
            call.close();
            $.notify('Call rejected!', "info");
        }
    });

    // Event handlers for buttons
    $("#connectUsingCodeBtn").on("click", connectRoomId);
    $("#sendMsgBtn").on("click", sendMessage);

    // Function to populate recipient select dropdown
    function populateRecipientSelect() {
        var $select = $("#recipientSelect");
        $select.empty();
        Object.keys(peer.connections).forEach(function (key) {
            $select.append('<option value="' + key + '">' + connections[key] + '</option>');
        });
    }

    // Function to handle new user connection
    function handleNewUserConnected(userId) {
        console.log("New user : " + userId);
        addUserCard(userId);
        connectionTimes[userId] = new Date();
        updateConnectionTime(userId);
    }

    // Function to update connection time
    function updateConnectionTime(userId) {
        const updateTime = setInterval(() => {
            const elapsedTime = Math.floor((new Date() - connectionTimes[userId]) / 1000);
            const minutes = Math.floor(elapsedTime / 60);
            const seconds = elapsedTime % 60;
            const activeTime = `Active Since ${minutes} mins ${seconds} secs`;
            $(`#user_${userId}_active_time`).text(activeTime);
        }, 1000);
        connectionTimes[userId + '_interval'] = updateTime;
    }

    // Function to add user card
    function addUserCard(userId) {
        const username = userId;

        var card = $('<div class="col" id="user_' + userId + '_card"> \
                        <div class="card animate__animated animate__fadeIn"> \
                            <div class="card-footer"> \
                                <div class="row"> \
                                    <div class="col-sm-6 text-start"> \
                                        <span class="card-title">' + username + '</span> \
                                    </div> \
                                    <div class="col-sm-6 text-end"> <small class="text-muted" id="user_' + userId + '_active_time"> </small></div> \
                                </div> \
                            </div> \
                            <div class="card-body text-end"> \
                                \
                                <img id="user_' + userId + '_img_placeholder" src="./images/luffy.gif" class="card-img-top p-2" alt="luffy called you">\
                                <video  id="user_' + userId + '_video_ele" class="card-img-top" autoplay playsinline muted"    style="display: none;"></video> \
                            </div> \
                            <div class="card-footer p-0"> \
                                <div class="btn-toolbar justify-content-end" role="toolbar" aria-label="Toolbar with button groups"> \
                                    <div class="ml-auto"> \
                                        <button  type="button" id="user_' + userId + '_make_call_btn" class="btn"><img src="./images/call.svg" alt="Make call" width="16" height="16"></button> \
                                        <button type="button" id="user_' + userId + '_close_video_btn" class="btn"><img src="./images/noVideo.svg" alt="No video" width="16" height="16"></button> \
                                        <button type="button" id="user_' + userId + '_mute_btn" class="btn"><img src="./images/mute.svg" alt="Mute Icon" width="16" height="16"></button> \
                                        <button type="button" id="user_' + userId + '_disconnect_btn" class="btn"><img src="./images/xSquare.svg" alt="Close Icon" width="16" height="16"></button> \
                                        <button type="button" id="user_' + userId + '_trash_btn" class="btn"><img src="./images/trash.svg" alt="Trash Icon" width="16" height="16"></button> \
                                      </div> \
                                </div> \
                            </div> \
                        </div> \
                    </div>');

        $('#containerForCards').append(card);
    }

    // Event handler for button clicks within user cards
    $('#containerForCards').on('click', 'button', function (event) {
        var btnId = $(this).attr('id');
        var userId = getUserIdFromBtnId(btnId);

        if (btnId.includes('_make_call_btn')) {
            makeCallToUser(userId);
        } else if (btnId.includes('_close_video_btn')) {
            closeVideoForUser(userId);
        } else if (btnId.includes('_mute_btn')) {
            muteUser(userId);
        } else if (btnId.includes('_disconnect_btn')) {
            disconnectUser(userId);
        } else if (btnId.includes('_trash_btn')) {
            trashConnection(userId);
        }
    });

    // Function to extract user ID from button ID
    function getUserIdFromBtnId(btnId) {
        var parts = btnId.split('_');
        return parts[1];
    }

    // Function to get user media stream
    function getUserMediaStream() {
        var getUserMedia = navigator.mediaDevices.getUserMedia || navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
        return getUserMedia({ video: true, audio: true })
            .then(stream => stream);
    }

    // Function to make a call to a user
    function makeCallToUser(userId) {
        getUserMediaStream()
            .then(stream => {
                localStream = stream;
                const videoElement = document.getElementById('local-video');
                videoElement.srcObject = stream;
                videoElement.muted = true;
                videoElement.play();

                const call = peer.call(userId, localStream, { video: true, audio: true });
                callConnections[call.peer] = call;

                call.on('stream', function (remoteStream) {
                    const imgPlaceholder = $('#user_' + call.peer + '_img_placeholder');
                    imgPlaceholder.hide();
                    const videoElement = document.getElementById('user_' + userId + '_video_ele');
                    videoElement.style.display = "block";
                    videoElement.srcObject = remoteStream;
                    videoElement.play();
                    const btnImgSrc = videoElement.muted ? "./images/mute.svg" : "./images/unMute.svg";
                    $('#user_' + userId + '_mute_btn img').attr('src', btnImgSrc);
                });

                $('#local-video').addClass('visible');
            })
            .catch(err => {
                console.error('Error getting user media:', err);
                $.notify('Failed to access camera and microphone!', "error");
            });
    }

    // Function to close video for a user
    function closeVideoForUser(userId) {
        var videoElement = $('#user_' + userId + '_video_ele');
        var imgPlaceholder = $('#user_' + userId + '_img_placeholder');

        if (videoElement.is(":hidden")) {
            videoElement[0].play();
            videoElement.show();
            imgPlaceholder.hide();
            $.notify('Video shown for user: ' + userId, "info");
        } else {
            videoElement.attr('srcObject', null);
            videoElement[0].pause();
            videoElement.hide();
            imgPlaceholder.show();
            $.notify('Video hidden for user: ' + userId, "warn");
        }

        const btnImgSrc = videoElement.is(":hidden") ? "./images/showVideo.svg" : "./images/noVideo.svg";
        $('#user_' + userId + '_close_video_btn img').attr('src', btnImgSrc);
    }

    // Function to mute/unmute a user
    function muteUser(userId) {
        const videoElement = document.getElementById('user_' + userId + '_video_ele');
        videoElement.muted = !videoElement.muted;
        if (videoElement.muted) {
            $.notify('Muted user: ' + userId, "info");
        } else {
            $.notify('Un-Muted user: ' + userId, "info");
        }

        const btnImgSrc = videoElement.muted ? "./images/mute.svg" : "./images/unMute.svg";
        $('#user_' + userId + '_mute_btn img').attr('src', btnImgSrc);
    }

    // Function to disconnect a user
    function disconnectUser(userId) {
        clearInterval(connectionTimes[userId + '_interval']);
        delete connectionTimes[userId + '_interval'];

        var connection = peer.connections[userId][0];
        var callConnection = callConnections[userId];

        connection.close();
        callConnection.close();

        $.notify('Disconnected user: ' + userId, "warn");
    }

    // Function to remove user connection
    function trashConnection(userId) {
        $('#user_' + userId + '_card').remove();
        disconnectUser(userId);
    }

    // Function to play notification sound
    function playNotificationSound() {
        var audio = $("#notificationSound")[0];
        audio.play();
    }
});
