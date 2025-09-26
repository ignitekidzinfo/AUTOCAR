package com.ProblemSolvings.Problem.Solving.Peoblemnew;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.channels.FileChannel;

public class ReplaceFile {

    private static final String STATIC_FOLDER = "src/main/resources/static";
    private static final String LOCAL_FILE = "C:\\Users\\admin\\Downloads\\a.pdf";
    private static final String FILENAME = "a.pdf";

    public static void main(String[] args) {
        File staticFile = new File(STATIC_FOLDER + File.separator + FILENAME);
        File localFile = new File(LOCAL_FILE);

        try {
            if (staticFile.exists()) {
                if (localFile.exists()) {
                    System.out.println("Replacing the existing file in the Downloads folder...");
                    replaceFile(staticFile, localFile);
                } else {
                    System.out.println("Copying the file from the static folder to the Downloads folder...");
                    copyFile(staticFile, localFile);
                }
                System.out.println("Operation completed successfully.");
            } else {
                System.out.println("The source file does not exist in the static folder: " + STATIC_FOLDER);
            }
        } catch (IOException e) {
            System.err.println("An error occurred during the file operation: " + e.getMessage());
        }
    }

    private static void copyFile(File source, File dest) throws IOException {
        try (FileChannel sourceChannel = new FileInputStream(source).getChannel();
             FileChannel destChannel = new FileOutputStream(dest).getChannel()) {
            destChannel.transferFrom(sourceChannel, 0, sourceChannel.size());
        }
    }

    private static void replaceFile(File source, File dest) throws IOException {
        if (dest.delete()) {
            copyFile(source, dest);
        } else {
            System.err.println("Failed to delete the existing file in the Downloads folder.");
        }
    }
}
