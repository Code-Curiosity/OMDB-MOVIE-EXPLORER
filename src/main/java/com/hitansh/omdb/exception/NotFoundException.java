package com.hitansh.omdb.exception;

//Simple runtime exception used to indicate a 404-like condition in service/content
public class NotFoundException extends RuntimeException{
    public NotFoundException(String message){
        super(message);
    }
}
