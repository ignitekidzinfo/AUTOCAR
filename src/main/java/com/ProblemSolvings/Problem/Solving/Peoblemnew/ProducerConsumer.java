package com.ProblemSolvings.Problem.Solving.Peoblemnew;

import java.util.LinkedList;

class ProducerConsumer {
    LinkedList<Integer> list = new LinkedList<>();
    int capacity = 2;

    public void produce() throws InterruptedException {
        int value = 0;
        while (true) {
            synchronized (this) {
                while (list.size() == capacity) wait();
                System.out.println("Produced: " + value);
                list.add(value++);
                notify();
                Thread.sleep(1000);
            }
        }
    }

    public void consume() throws InterruptedException {
        while (true) {
            synchronized (this) {
                while (list.isEmpty()) wait();
                int val = list.removeFirst();
                System.out.println("Consumed: " + val);
                notify();
                Thread.sleep(1000);
            }
        }
    }
}

 class ProducerConsumerDemo {
    public static void main(String[] args) {
        ProducerConsumer pc = new ProducerConsumer();
        Thread t1 = new Thread(() -> {
            try {
                pc.produce();
            }catch (InterruptedException e) {
                e.printStackTrace();
            }
        });
        Thread t2 = new Thread(() -> {
            try {
                pc.consume();
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        });
        t1.start();
        t2.start();
    }
}
//Why LinkedList?: It efficiently supports dynamic size, FIFO behavior, and simple operations
// for insertion and deletion at the ends.
//Alternatives: While other data structures like ArrayDeque or BlockingQueue can be used,
// LinkedList is chosen here to emphasize manual synchronization and basic queue-like behavior.
//Practical Applications: In real-world implementations, classes like BlockingQueue would be
// preferred for thread-safe producer-consumer scenarios.
//
