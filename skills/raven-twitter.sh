#!/bin/bash
# Raven's Twitter Interface - Wrapper for Bird CLI

export AUTH_TOKEN=66dcfc1d49fd8d3661abe8e2ffd14434dcd60851
export CT0=96b316c35f514326e574712dd871bb1f1089ccebadf2722e8065c16483a08790171d28da14c85d9c50a1fd75beb11719f016a4545c9e8b689719c22eb4c4f6eca8f0d297f5784180344c826f6435cfd5

# Execute bird with all arguments
bird "$@"
