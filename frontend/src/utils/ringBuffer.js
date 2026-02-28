export class RingBuffer {
  constructor(size) {
    this.size = size;
    this.buffer = [];
  }

  push(item) {
    if (this.buffer.length >= this.size) {
      this.buffer.shift();
    }
    this.buffer.push(item);
  }

  getAll() {
    return this.buffer;
  }

  clear() {
    this.buffer = [];
  }
}
