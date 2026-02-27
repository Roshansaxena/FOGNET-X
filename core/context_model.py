class ContextModel:

    def __init__(self):
        self.state = {}

    def update(self, device_id, sensor_data):
        self.state[device_id] = sensor_data

    def get_device_context(self, device_id):
        return self.state.get(device_id, {})

    def get_global_context(self):
        return self.state
