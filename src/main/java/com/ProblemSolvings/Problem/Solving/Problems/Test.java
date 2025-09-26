package com.ProblemSolvings.Problem.Solving.Problems;

import java.awt.*;
import java.util.Random;

public class Test {

    public static void main(String[] args) {
        try {
            // Create a Robot instance to control the mouse
            Robot robot = new Robot();
            Random random = new Random();

            // Get screen size to ensure mouse moves within bounds
            Dimension screenSize = Toolkit.getDefaultToolkit().getScreenSize();
            int screenWidth = (int) screenSize.getWidth();
            int screenHeight = (int) screenSize.getHeight();

            System.out.println("Screen width: " + screenWidth + ", Screen height: " + screenHeight);

            // Loop to move the mouse every 20 seconds
            while (true) {
                // Wait for 20 seconds
                System.out.println("Waiting for 20 seconds...");
                Thread.sleep(20000);

                System.out.println("Starting mouse movement for 10 seconds...");

                // Move the mouse for 10 seconds
                long startTime = System.currentTimeMillis();
                while (System.currentTimeMillis() - startTime < 10000) {
                    // Generate random coordinates within the screen resolution
                    int x = random.nextInt(screenWidth);
                    int y = random.nextInt(screenHeight);

                    // Move the mouse to the random position
                    robot.mouseMove(x, y);

                    System.out.println("Mouse moved to: (" + x + ", " + y + ")");

                    // Wait 1 second before the next move
                    Thread.sleep(1000);
                }

                System.out.println("Mouse movement complete.");
            }
        } catch (AWTException | InterruptedException e) {
            e.printStackTrace();
        }
    }
    }


