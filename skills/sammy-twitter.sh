#!/bin/bash
# Sammy's Twitter Interface - Wrapper for Bird CLI
# Account: @SammySingh79524

export AUTH_TOKEN=cb85857fa2b9322de79604f33295178e9ed65d71
export CT0=521a81f2ae899faeb02add9eac9264430b693b7c560ba84687ba7a84978d2864237fda62042bc019211d7e7b16849e819944fc05d19be17484b3c76a20288bf9cd18dbd89084a1fc17916200a55cdb03

# Execute bird with all arguments
bird "$@"
