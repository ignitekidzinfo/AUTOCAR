package com.ProblemSolvings.Problem.Solving.Problems;

class Node {
    int data;
    Node left, right;

    public Node(int item) {
        data = item;
        left = right = null;
    }
}
public class BinaryTree {
    Node root;

    // Inorder Traversal (Left → Root → Right)
    void inorder(Node node) {
        if (node == null) return;

        inorder(node.left); // Visit left subtree
        System.out.print(node.data + " "); // Visit root
        inorder(node.right); // Visit right subtree
    }

    public static void main(String[] args) {
        BinaryTree tree = new BinaryTree();
        tree.root = new Node(1);
        tree.root.left = new Node(2);
        tree.root.right = new Node(3);
        tree.root.left.left = new Node(4);
        tree.root.left.right = new Node(5);

        System.out.println("Inorder Traversal:");
        tree.inorder(tree.root);
    }
}
