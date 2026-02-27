socketio = None

def init_socketio(sio):
    global socketio
    socketio = sio

def emit_decision(device_id, allocation, risk):
    if socketio:
        socketio.emit("decision_event", {
            "device_id": device_id,
            "allocation": allocation,
            "risk": risk
        })

def emit_metrics(payload):
    if socketio:
        print("Emitting metrics_event")
        socketio.emit("metrics_event", payload)